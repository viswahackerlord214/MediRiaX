import { prisma } from '../config/db';
import { createChatForAcceptedAppointment } from './chat.service';

export const bookAppointment = async (
    patientId: string,
    doctorId: string,
    dateTime: Date,
    reasonForVisit: string,
    sharedRecordIds?: string[]
) => {
    // 1. Verify the doctor actually exists before booking
    const doctorExists = await prisma.user.findUnique({
        where: { id: doctorId, role: 'DOCTOR' }
    });

    if (!doctorExists) {
        throw new Error('Doctor not found or invalid ID.');
    }

    // 2. Check for time slot conflicts (prevent double-booking)
    const existingAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId,
            dateTime,
            status: { not: 'CANCELLED' }
        }
    });

    if (existingAppointment) {
        throw new Error('This time slot is already booked. Please choose another time.');
    }

    // 3. Create the appointment with REQUESTED status
    const appointment = await prisma.appointment.create({
        data: {
            patientId,
            doctorId,
            dateTime,
            reasonForVisit,
            status: 'REQUESTED'
        }
    });

    // 4. Attach explicitly shared medical records if any
    if (sharedRecordIds && sharedRecordIds.length > 0) {
        const patientRecords = await prisma.medicalRecord.findMany({
            where: {
                id: { in: sharedRecordIds },
                patientId
            },
            select: { id: true }
        });

        const validRecordIds = patientRecords.map(r => r.id);

        if (validRecordIds.length > 0) {
            await prisma.appointmentMedicalRecord.createMany({
                data: validRecordIds.map(recordId => ({
                    appointmentId: appointment.id,
                    medicalRecordId: recordId
                })),
                skipDuplicates: true
            });
        }
    }

    // 5. Notify Doctor of new appointment request
    await prisma.notification.create({
        data: {
            userId: doctorId,
            message: `New appointment requested for ${new Date(dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
        }
    });

    return appointment;
};

export const acceptAppointment = async (appointmentId: string, doctorId: string) => {
    return await updateAppointmentStatus(appointmentId, doctorId, 'DOCTOR', 'ACCEPTED');
};

export const getDoctorAppointments = async (doctorId: string) => {
    return await prisma.appointment.findMany({
        where: { doctorId },
        include: {
            patient: {
                select: {
                    id: true,
                    email: true,
                    patientProfile: true
                },
            },
            sharedRecords: {
                include: {
                    medicalRecord: true
                }
            },
            chat: {
                select: {
                    id: true,
                    status: true
                }
            }
        },
        orderBy: { dateTime: 'asc' },
    });
};

export const getSharedAppointmentRecords = async (appointmentId: string, userId: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
        throw new Error('Unauthorized: You can only view shared records for your own appointments');
    }

    const shared = await prisma.appointmentMedicalRecord.findMany({
        where: { appointmentId },
        include: {
            medicalRecord: true
        }
    });

    return shared.map(s => s.medicalRecord);
};

export const updateAppointmentStatus = async (appointmentId: string, userId: string, userRole: string, status: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            doctor: { include: { doctorProfile: true } },
            patient: { include: { patientProfile: true } }
        }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    // Authorization check
    if (userRole === 'PATIENT') {
        if (appointment.patientId !== userId) {
            throw new Error('Unauthorized: You can only update your own appointments');
        }
        if (status !== 'CANCELLED') {
            throw new Error('Unauthorized: Patients can only cancel appointments');
        }
    } else if (userRole === 'DOCTOR') {
        if (appointment.doctorId !== userId) {
            throw new Error('Unauthorized: You can only update your own appointments');
        }
    } else {
        throw new Error('Unauthorized role');
    }

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: status as any },
    });

    const doctorName = appointment.doctor?.doctorProfile
        ? `Dr. ${appointment.doctor.doctorProfile.firstName} ${appointment.doctor.doctorProfile.lastName}`
        : 'Your Doctor';

    // ACTION 1: ACCEPTED
    if ((status === 'ACCEPTED' || status === 'SCHEDULED') && userRole === 'DOCTOR') {
        await createChatForAcceptedAppointment(appointmentId, userId);
        
        await prisma.notification.create({
            data: {
                userId: appointment.patientId,
                message: `${doctorName} has accepted your appointment. You can now communicate through the consultation chat.`,
            }
        });
    }

    // ACTION 2: COMPLETED
    if (status === 'COMPLETED') {
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
                    messageContent: '✅ Consultation Completed: Your consultation has been completed.'
                }
            });
        }

        await prisma.notification.create({
            data: {
                userId: appointment.patientId,
                message: `Your consultation with ${doctorName} has been completed.`,
            }
        });
    }

    // ACTION 3: CANCELLED (Lock Chat as READ_ONLY & Notify opposing party)
    if (status === 'CANCELLED') {
        const chat = await prisma.consultationChat.findUnique({
            where: { appointmentId }
        });

        if (chat) {
            await prisma.consultationChat.update({
                where: { id: chat.id },
                data: { status: 'READ_ONLY' }
            });

            await prisma.chatMessage.create({
                data: {
                    chatId: chat.id,
                    senderId: null,
                    senderRole: 'System',
                    messageType: 'SYSTEM',
                    messageContent: `🔴 Appointment Cancelled: This consultation chat is now closed in read-only mode.`
                }
            });
        }

        if (userRole === 'PATIENT') {
            await prisma.notification.create({
                data: {
                    userId: appointment.doctorId,
                    message: `Patient has cancelled their appointment on ${new Date(appointment.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
                }
            });
        } else {
            await prisma.notification.create({
                data: {
                    userId: appointment.patientId,
                    message: `${doctorName} has cancelled the appointment on ${new Date(appointment.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
                }
            });
        }
    }

    return updated;
};

export const getPatientAppointments = async (patientId: string) => {
    return await prisma.appointment.findMany({
        where: { patientId },
        include: {
            doctor: {
                select: {
                    id: true,
                    email: true,
                    doctorProfile: true,
                },
            },
            sharedRecords: {
                include: {
                    medicalRecord: true
                }
            },
            chat: {
                select: {
                    id: true,
                    status: true
                }
            }
        },
        orderBy: { dateTime: 'desc' },
    });
};