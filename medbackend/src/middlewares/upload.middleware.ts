import multer from 'multer';
import path from 'path';

// Use memory storage for direct buffer upload to Supabase Storage
const storage = multer.memoryStorage();

const pdfFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF files (.pdf) are allowed.'));
  }
};

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: pdfFileFilter,
});