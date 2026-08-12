import { Request, Response } from 'express';
import * as recordService from '../services/record.service';
import { uploadPdfToStorage } from '../services/storage.service';

export const createRecordHandler = async (req: Request, res: Response) => {
    try {
        const doctorId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'DOCTOR') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only doctors can create medical records' });
            return;
        }

        const { patientId, appointmentId, diagnosis, prescription, notes } = req.body;

        if (!patientId || !appointmentId || !diagnosis) {
            res.status(400).json({ status: 'error', message: 'patientId, appointmentId, and diagnosis are required' });
            return;
        }

        const record = await recordService.createMedicalRecord(patientId, doctorId, appointmentId, diagnosis, prescription, notes);
        res.status(201).json({ status: 'success', data: { record } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error creating medical record' });
    }
};

export const getPatientRecordsHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can access this endpoint' });
            return;
        }

        const records = await recordService.getPatientRecords(patientId);
        res.status(200).json({ status: 'success', data: { records } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error fetching medical records' });
    }
};

// Patient uploads a PDF/image document to Supabase Storage & saves record
export const uploadPdfDocumentHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can upload documents' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No file attached. Please select a valid document.' });
            return;
        }

        const { title, category, recordType, hospitalName, reportDate } = req.body;

        const recordTitle = title || req.file.originalname;

        // Upload to Supabase Storage
        const storagePath = await uploadPdfToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const parsedDate = reportDate ? new Date(reportDate) : new Date();

        const document = await recordService.addPatientPdfDocument({
            patientId,
            title: recordTitle.trim(),
            category: recordType || category || 'Lab Report',
            hospitalName: hospitalName ? hospitalName.trim() : null,
            reportDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
            storagePath,
        });

        res.status(201).json({ status: 'success', data: { document } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error uploading document' });
    }
};

// Patient renames a record
export const renameRecordHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can rename records' });
            return;
        }

        const { id } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            res.status(400).json({ status: 'error', message: 'New title is required.' });
            return;
        }

        const updated = await recordService.renameMedicalRecord(patientId, id as string, title);
        res.status(200).json({ status: 'success', data: { record: updated } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error renaming record' });
    }
};

// Patient deletes a document/record
export const deleteDocumentHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can delete documents' });
            return;
        }

        const { id } = req.params;
        await recordService.deletePatientDocument(patientId, id as string);

        res.status(200).json({ status: 'success', message: 'Document deleted successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error deleting document' });
    }
};

export const getPatientDocumentsHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can view documents' });
            return;
        }

        const documents = await recordService.getPatientDocuments(patientId);
        res.status(200).json({ status: 'success', data: { documents } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message || 'Error fetching documents' });
    }
};