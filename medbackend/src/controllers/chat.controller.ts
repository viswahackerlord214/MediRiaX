import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import { uploadPdfToStorage } from '../services/storage.service';

export const getAppointmentChatHandler = async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.appointmentId as string;
        const userId = (req as any).user.userId;

        const chat = await chatService.getAppointmentChat(appointmentId, userId);
        res.status(200).json({ status: 'success', data: { chat } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const sendMessageHandler = async (req: Request, res: Response) => {
    try {
        const chatId = req.params.chatId as string;
        const senderId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const senderRole = userRole === 'DOCTOR' ? 'Doctor' : 'Patient';

        const { messageType, messageContent, fileUrl } = req.body;

        if (!messageContent && !fileUrl) {
            res.status(400).json({ status: 'error', message: 'Message content or fileUrl is required' });
            return;
        }

        const message = await chatService.sendMessage(
            chatId,
            senderId,
            senderRole,
            messageType || 'TEXT',
            messageContent || '',
            fileUrl
        );

        res.status(201).json({ status: 'success', data: { message } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const shareAdditionalMedicalRecordHandler = async (req: Request, res: Response) => {
    try {
        const chatId = req.params.chatId as string;
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can share additional records' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'Medical record document file is required' });
            return;
        }

        const { title, recordType, hospitalName } = req.body;

        if (!title || !title.trim()) {
            res.status(400).json({ status: 'error', message: 'Record title is required' });
            return;
        }

        // Upload to Supabase Storage
        const fileUrl = await uploadPdfToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const result = await chatService.shareAdditionalMedicalRecord({
            chatId,
            patientId,
            title: title.trim(),
            recordType: recordType || 'Lab Report',
            fileUrl,
            hospitalName: hospitalName ? hospitalName.trim() : undefined,
        });

        res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const uploadChatImageHandler = async (req: Request, res: Response) => {
    try {
        const chatId = req.params.chatId as string;
        const senderId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const senderRole = userRole === 'DOCTOR' ? 'Doctor' : 'Patient';

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No image file attached' });
            return;
        }

        const fileUrl = await uploadPdfToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
        const messageType = isPdf ? 'PDF' : 'IMAGE';

        const message = await chatService.sendMessage(
            chatId,
            senderId,
            senderRole,
            messageType,
            req.file.originalname,
            fileUrl
        );

        res.status(201).json({ status: 'success', data: { message } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const setMeetingLinkHandler = async (req: Request, res: Response) => {
    try {
        const appointmentId = req.params.appointmentId as string;
        const doctorId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'DOCTOR') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only doctors can set meeting links' });
            return;
        }

        const { meetingLink } = req.body;

        if (!meetingLink || !meetingLink.trim()) {
            res.status(400).json({ status: 'error', message: 'Meeting link URL is required' });
            return;
        }

        const appointment = await chatService.setMeetingLink(appointmentId, doctorId, meetingLink);
        res.status(200).json({ status: 'success', data: { appointment } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};