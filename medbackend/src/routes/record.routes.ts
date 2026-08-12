import { Router } from 'express';
import {
    createRecordHandler,
    getPatientRecordsHandler,
    uploadPdfDocumentHandler,
    deleteDocumentHandler,
    getPatientDocumentsHandler,
    renameRecordHandler
} from '../controllers/record.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { uploadPdf } from '../middlewares/upload.middleware';

const router = Router();

router.post('/', requireAuth, createRecordHandler);
router.get('/my-history', requireAuth, getPatientRecordsHandler);

// Secure PDF/Record Upload & Management Routes
router.post('/upload-pdf', requireAuth, uploadPdf.single('pdfFile'), uploadPdfDocumentHandler);
router.get('/documents', requireAuth, getPatientDocumentsHandler);
router.patch('/documents/:id/rename', requireAuth, renameRecordHandler);
router.delete('/documents/:id', requireAuth, deleteDocumentHandler);

export default router;