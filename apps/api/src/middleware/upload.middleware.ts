import multer from 'multer';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const allowed = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/csv',
    'text/plain',
    'application/pdf',
  ];
  const okByMime = allowed.includes(file.mimetype);
  const okByExt = /\.(csv|pdf)$/i.test(file.originalname);
  if (okByMime || okByExt) {
    cb(null, true);
    return;
  }
  cb(AppError.badRequest('Only CSV or PDF files are allowed'));
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
