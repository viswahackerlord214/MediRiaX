import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { uploadPdf } from '../middlewares/upload.middleware';
import {
    getAppointmentChatHandler,
    sendMessageHandler,
    uploadChatImageHandler,
    setMeetingLinkHandler,
    shareAdditionalMedicalRecordHandler
} from '../controllers/chat.controller';

const router = Router();

// GET /api/v1/chats/appointment/:appointmentId - Get chat room & messages
router.get('/appointment/:appointmentId', requireAuth, getAppointmentChatHandler);

// POST /api/v1/chats/:chatId/messages - Send text message
router.post('/:chatId/messages', requireAuth, sendMessageHandler);

// POST /api/v1/chats/:chatId/upload-image - Upload chat image or file attachment
router.post('/:chatId/upload-image', requireAuth, uploadPdf.single('file'), uploadChatImageHandler);

// POST /api/v1/chats/:chatId/share-medical-record - Mid-consultation record sharing
router.post('/:chatId/share-medical-record', requireAuth, uploadPdf.single('documentFile'), shareAdditionalMedicalRecordHandler);

// POST /api/v1/chats/appointment/:appointmentId/meeting-link - Set video meeting link
router.post('/appointment/:appointmentId/meeting-link', requireAuth, setMeetingLinkHandler);

export default router;
