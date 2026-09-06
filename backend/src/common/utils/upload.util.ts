import { join, extname } from 'path';
import { tmpdir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export function getUploadsBasePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return join(tmpdir(), 'uploads');
  }
  return join(process.cwd(), 'uploads');
}

export function getUploadDir(subDir?: string): string {
  const base = getUploadsBasePath();
  const dir = subDir ? join(base, subDir) : base;
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch (err) {
    // If creating dir in cwd fails (e.g. read-only filesystem), fallback to os.tmpdir()
    const fallbackDir = subDir ? join(tmpdir(), 'uploads', subDir) : join(tmpdir(), 'uploads');
    try {
      if (!existsSync(fallbackDir)) {
        mkdirSync(fallbackDir, { recursive: true });
      }
    } catch {}
    return fallbackDir;
  }
}

const KYC_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const KYC_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function kycFileUploadOptions() {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, getUploadDir('kyc'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: KYC_MAX_FILE_SIZE_BYTES },
    fileFilter: (
      req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!KYC_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(
          new BadRequestException(
            'Only JPEG, PNG, or PDF files are allowed for KYC documents',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}
