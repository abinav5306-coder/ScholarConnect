import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import os from 'os';
// Private secure directory for student resumes (uses os.tmpdir() in serverless environments like Vercel)
export const RESUME_UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads', 'resumes')
  : path.resolve(__dirname, '../uploads/resumes');

try {
  if (!fs.existsSync(RESUME_UPLOAD_DIR)) {
    fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[Resume] Directory initialization warning:', err.message);
}

// Multer disk storage for PDF resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESUME_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `resume_${uniqueSuffix}${ext}`);
  },
});

// File filter: strict PDF validation only
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents (.pdf) up to 5MB are permitted.'), false);
  }
};

export const uploadResumeFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max limit
  },
});

