import { prisma } from '../config/db';

export const createChatForAcceptedAppointment = async (appointmentId: string, doctorId: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            doctor: {
                include: { doctorProfile: true }
            },
            patient: {
                include: { patientProfile: true }
            },
            sharedRecords: {
                include: { medicalRecord: true }
            }
        }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.doctorId !== doctorId) {
        throw new Error('Unauthorized: Only the assigned doctor can accept this appointment');
    }

    let chat = await prisma.consultationChat.findUnique({
        where: { appointmentId },
        include: { messages: true }
    });

    if (!chat) {
        const createdChat = await prisma.consultationChat.create({
            data: {
                appointmentId,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                status: 'ACTIVE',
            },
            include: { messages: true }
        });
        chat = createdChat;

        const doctorName = appointment.doctor?.doctorProfile
            ? `Dr. ${appointment.doctor.doctorProfile.firstName} ${appointment.doctor.doctorProfile.lastName}`
            : appointment.doctor?.email || 'Your Doctor';

        const scheduledTimeStr = new Date(appointment.dateTime).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        // 1. Initial System Messages
        await prisma.chatMessage.createMany({
            data: [
                {
                    chatId: createdChat.id,
                    senderId: null,
                    senderRole: 'System',
                    messageType: 'SYSTEM',
                    messageContent: `🟢 ${doctorName} has accepted your appointment.`
                },
                {
                    chatId: createdChat.id,
                    senderId: null,
                    senderRole: 'System',
                    messageType: 'SYSTEM',
                    messageContent: `📅 Your consultation is scheduled for ${scheduledTimeStr}.`
                }
            ]
        });

        // 2. Automatically post Patient Shared Medical Records in chat
        if (appointment.sharedRecords && appointment.sharedRecords.length > 0) {
            const sharedMessages = appointment.sharedRecords.map(sr => ({
                chatId: createdChat.id,
                senderId: appointment.patientId,
                senderRole: 'Patient',
                messageType: 'MEDICAL_RECORD',
                messageContent: sr.medicalRecord.title,
                fileUrl: sr.medicalRecord.fileUrl || sr.medicalRecord.storagePath || ''
            }));

            await prisma.chatMessage.createMany({
                data: sharedMessages
            });
        }
    }

    return chat;
};

export const getAppointmentChat = async (appointmentId: string, userId: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    // Privacy rule check: Only assigned doctor or patient can access
    if (appointment.patientId !== userId && appointment.doctorId !== userId) {
        throw new Error('Unauthorized: You do not have access to this consultation chat');
    }

    let chat = await prisma.consultationChat.findUnique({
        where: { appointmentId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            },
            appointment: true
        }
    });

    if (!chat) {
        return null;
    }

    // Lock chat if appointment is CANCELLED or 7-day post-completion window passed
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isCancelled = appointment.status === 'CANCELLED';
    const isPastSevenDays = appointment.status === 'COMPLETED' && (Date.now() - new Date(appointment.updatedAt).getTime() > SEVEN_DAYS_MS);

    if (isCancelled || isPastSevenDays) {
        if (chat.status !== 'READ_ONLY') {
            chat = await prisma.consultationChat.update({
                where: { id: chat.id },
                data: { status: 'READ_ONLY' },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    },
                    appointment: true
                }
            });
        }
    }

    return chat;
};

export const sendMessage = async (
    chatId: string,
    senderId: string,
    senderRole: string,
    messageType: string,
    messageContent: string,
    fileUrl?: string
) => {
    const chat = await prisma.consultationChat.findUnique({
        where: { id: chatId },
        include: { appointment: true }
    });

    if (!chat) {
        throw new Error('Chat room not found');
    }

    if (chat.patientId !== senderId && chat.doctorId !== senderId) {
        throw new Error('Unauthorized: You are not a participant in this chat');
    }

    if (chat.status === 'READ_ONLY' || chat.appointment.status === 'CANCELLED') {
        throw new Error('This consultation chat is read-only and no new messages can be sent.');
    }

    return await prisma.chatMessage.create({
        data: {
            chatId,
            senderId,
            senderRole,
            messageType: messageType || 'TEXT',
            messageContent,
            fileUrl: fileUrl || null
        }
    });
};

export const shareAdditionalMedicalRecord = async (payload: {
    chatId: string;
    patientId: string;
    title: string;
    recordType?: string;
    fileUrl: string;
    hospitalName?: string;
}) => {
    const chat = await prisma.consultationChat.findUnique({
        where: { id: payload.chatId },
        include: { appointment: true }
    });

    if (!chat || chat.patientId !== payload.patientId) {
        throw new Error('Unauthorized or chat room not found');
    }

    if (chat.status === 'READ_ONLY' || chat.appointment.status === 'CANCELLED') {
        throw new Error('Cannot share records in a cancelled or read-only consultation chat');
    }

    // 1. Create Medical Record owned by patient
    const medicalRecord = await prisma.medicalRecord.create({
        data: {
            patientId: payload.patientId,
            title: payload.title,
            recordType: payload.recordType || 'Lab Report',
            fileUrl: payload.fileUrl,
            storagePath: payload.fileUrl,
            hospitalName: payload.hospitalName || null,
            createdBy: 'Patient',
        }
    });

    // 2. Link to Appointment via AppointmentMedicalRecord
    await prisma.appointmentMedicalRecord.create({
        data: {
            appointmentId: chat.appointmentId,
            medicalRecordId: medicalRecord.id
        }
    });

    // 3. Post Chat Message
    const message = await prisma.chatMessage.create({
        data: {
            chatId: chat.id,
            senderId: payload.patientId,
            senderRole: 'Patient',
            messageType: 'MEDICAL_RECORD',
            messageContent: payload.title,
            fileUrl: payload.fileUrl
        }
    });

    // 4. Send Notification to Doctor
    await prisma.notification.create({
        data: {
            userId: chat.doctorId,
            message: `Patient has shared a new medical record: "${payload.title}" (${payload.recordType || 'Lab Report'})`,
        }
    });

    return { medicalRecord, message };
};

export const setMeetingLink = async (appointmentId: string, doctorId: string, meetingLink: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            doctor: { include: { doctorProfile: true } }
        }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.doctorId !== doctorId) {
        throw new Error('Unauthorized: Only the assigned doctor can set the meeting link');
    }

    const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { meetingLink: meetingLink.trim() }
    });

    const doctorName = appointment.doctor?.doctorProfile
        ? `Dr. ${appointment.doctor.doctorProfile.firstName} ${appointment.doctor.doctorProfile.lastName}`
        : 'Your Doctor';

    // Post to chat if chat exists
    const chat = await prisma.consultationChat.findUnique({
        where: { appointmentId }
    });

    if (chat) {
        await prisma.chatMessage.create({
            data: {
                chatId: chat.id,
                senderId: null,
                senderRole: 'System',
                messageType: 'SYSTEM',
                messageContent: '🎥 Video Consultation: Your doctor has shared the consultation link.'
            }
        });

        await prisma.chatMessage.create({
            data: {
                chatId: chat.id,
                senderId: doctorId,
                senderRole: 'Doctor',
                messageType: 'MEETING_LINK',
                messageContent: 'Video Consultation: Join your consultation here.',
                fileUrl: meetingLink.trim()
            }
        });
    }

    // Send Notification to Patient
    await prisma.notification.create({
        data: {
            userId: appointment.patientId,
            message: `${doctorName} has shared a video consultation link for your appointment.`,
        }
    });

    return updatedAppointment;
};

export const notifyPrescriptionUploaded = async (appointmentId: string, doctorId: string, prescriptionTitle: string, fileUrl: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment) return;

    const chat = await prisma.consultationChat.findUnique({
        where: { appointmentId }
    });

    if (chat) {
        await prisma.chatMessage.create({
            data: {
                chatId: chat.id,
                senderId: null,
                senderRole: 'System',
                messageType: 'SYSTEM',
                messageContent: '📄 Prescription Uploaded: Your prescription is ready.'
            }
        });

        await prisma.chatMessage.create({
            data: {
                chatId: chat.id,
                senderId: doctorId,
                senderRole: 'Doctor',
                messageType: 'PRESCRIPTION',
                messageContent: prescriptionTitle || 'Consultation Prescription',
                fileUrl
            }
        });
    }

    // Send Notification to Patient
    await prisma.notification.create({
        data: {
            userId: appointment.patientId,
            message: `Your prescription for consultation on ${new Date(appointment.dateTime).toLocaleDateString()} is now available.`,
        }
    });
};
