import { prisma } from '../config/db';
import { deletePdfFromStorage } from './storage.service';
import { notifyPrescriptionUploaded } from './chat.service';

export const createMedicalRecord = async (
    patientId: string,
    doctorId: string,
    appointmentId: string,
    diagnosis: string,
    prescription?: string,
    notes?: string
) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.doctorId !== doctorId || appointment.patientId !== patientId) {
        throw new Error('Unauthorized: Appointment details do not match');
    }

    const title = `Consultation Record: ${diagnosis}`;

    const record = await prisma.medicalRecord.create({
        data: {
            patientId,
            title,
            recordType: 'Prescription',
            fileUrl: '',
            createdBy: 'Doctor',
            diagnosis,
            prescription,
            notes,
            appointmentId,
        },
    });

    // Notify Chat
    await notifyPrescriptionUploaded(appointmentId, doctorId, title, '');

    return record;
};

export const addPatientMedicalRecord = async (payload: {
    patientId: string;
    title: string;
    recordType?: string;
    fileUrl: string;
    storagePath?: string;
    hospitalName?: string;
    reportDate?: Date;
    createdBy?: string;
}) => {
    return await prisma.medicalRecord.create({
        data: {
            patientId: payload.patientId,
            title: payload.title,
            recordType: payload.recordType || 'Lab Report',
            fileUrl: payload.fileUrl,
            storagePath: payload.storagePath || payload.fileUrl,
            hospitalName: payload.hospitalName || null,
            reportDate: payload.reportDate || new Date(),
            createdBy: payload.createdBy || 'Patient',
        },
    });
};

export const renameMedicalRecord = async (patientId: string, recordId: string, newTitle: string) => {
    const record = await prisma.medicalRecord.findFirst({
        where: { id: recordId, patientId },
    });

    if (!record) {
        throw new Error('Medical record not found or unauthorized');
    }

    return await prisma.medicalRecord.update({
        where: { id: recordId },
        data: { title: newTitle.trim() },
    });
};

export const deleteMedicalRecord = async (patientId: string, recordId: string) => {
    const record = await prisma.medicalRecord.findFirst({
        where: { id: recordId, patientId },
    });

    if (!record) {
        throw new Error('Medical record not found or unauthorized');
    }

    if (record.storagePath) {
        await deletePdfFromStorage(record.storagePath);
    }

    return await prisma.medicalRecord.delete({
        where: { id: recordId },
    });
};

export const getPatientMedicalRecords = async (patientId: string) => {
    return await prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { uploadedAt: 'desc' },
    });
};

// Legacy compatibility functions for patient documents
export const addPatientPdfDocument = async (payload: {
    patientId: string;
    title: string;
    category?: string;
    hospitalName?: string;
    reportDate?: Date;
    storagePath: string;
}) => {
    // Also save in MedicalRecord table for privacy-first sharing feature
    const medRecord = await addPatientMedicalRecord({
        patientId: payload.patientId,
        title: payload.title,
        recordType: payload.category || 'Lab Report',
        fileUrl: payload.storagePath,
        storagePath: payload.storagePath,
        hospitalName: payload.hospitalName,
        reportDate: payload.reportDate,
        createdBy: 'Patient',
    });

    try {
        await prisma.patientDocument.create({
            data: {
                patientId: payload.patientId,
                title: payload.title,
                category: payload.category || 'Lab Report',
                hospitalName: payload.hospitalName || null,
                reportDate: payload.reportDate || new Date(),
                storagePath: payload.storagePath,
                documentUrl: payload.storagePath,
            },
        });
    } catch (e) {
        // Ignore legacy doc table fallback errors if any
    }

    return medRecord;
};

export const deletePatientDocument = async (patientId: string, documentId: string) => {
    // Attempt delete from MedicalRecord first
    try {
        await deleteMedicalRecord(patientId, documentId);
    } catch (e) {
        // fallback
    }

    const document = await prisma.patientDocument.findFirst({
        where: { id: documentId, patientId },
    });

    if (document) {
        if (document.storagePath) {
            await deletePdfFromStorage(document.storagePath);
        }
        return await prisma.patientDocument.delete({
            where: { id: documentId },
        });
    }
};

export const getPatientDocuments = async (patientId: string) => {
    return await getPatientMedicalRecords(patientId);
};

export const getPatientRecords = async (patientId: string) => {
    return await getPatientMedicalRecords(patientId);
};