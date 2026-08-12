import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://whavslyqouyptfwfavai.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYXZzbHlxb3V5cHRmd2ZhdParentKey';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'medical-records';

export const uploadPdfToStorage = async (fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> => {
  const filePath = `patient-records/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType || 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage direct upload warning/fallback:', error.message);
      return saveLocalFallback(fileBuffer, filename);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
  } catch (err: any) {
    console.warn('Supabase Storage exception, using fail-safe storage fallback:', err.message);
    return saveLocalFallback(fileBuffer, filename);
  }
};

export const deletePdfFromStorage = async (storagePath: string): Promise<void> => {
  try {
    if (storagePath.includes(BUCKET_NAME)) {
      const parts = storagePath.split(`${BUCKET_NAME}/`);
      if (parts.length > 1) {
        const objectKey = parts[1];
        await supabase.storage.from(BUCKET_NAME).remove([objectKey]);
      }
    } else if (storagePath.includes('/uploads/')) {
      const localFileName = path.basename(storagePath);
      const localFilePath = path.join(__dirname, '../../public/uploads', localFileName);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  } catch (err: any) {
    console.error('Error deleting file from storage:', err.message);
  }
};

function saveLocalFallback(fileBuffer: Buffer, filename: string): string {
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fullPath = path.join(uploadsDir, safeName);
  fs.writeFileSync(fullPath, fileBuffer);

  return `http://localhost:3000/uploads/${safeName}`;
}
