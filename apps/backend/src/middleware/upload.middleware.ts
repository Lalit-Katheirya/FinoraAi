import path from 'path';
import fs from 'fs';
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

const avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');

function ensureAvatarDir(): void {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAvatarDir();
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id ?? 'anon';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `${userId}-${Date.now()}${safeExt}`);
  },
});

function avatarFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const okMime = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
  const okExt = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
  if (okMime || okExt) {
    cb(null, true);
    return;
  }
  cb(AppError.badRequest('Only JPG, PNG, WEBP, or GIF images are allowed'));
}

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: avatarFilter,
});

export function getAvatarPublicUrl(filename: string): string {
  return `/uploads/avatars/${filename}`;
}

export function getAvatarDir(): string {
  ensureAvatarDir();
  return avatarDir;
}
