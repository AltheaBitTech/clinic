import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, mkdirSync } from 'fs';

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
