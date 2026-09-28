import * as fs from 'fs';
import * as path from 'path';
import { NOTO_BOLD, NOTO_ITALIC, NOTO_REGULAR } from './pdf-assets';
import { getUploadsBasePath } from './upload.util';
import type { StorageService } from '../../storage/storage.service';

export { AROGYIX_WORDMARK_PNG } from './pdf-assets';

/** Registers the embedded 'Body' / 'Bold' / 'Italic' fonts on a PDFKit doc. */
export function registerPdfFonts(doc: any): void {
  doc.registerFont('Body', NOTO_REGULAR);
  doc.registerFont('Bold', NOTO_BOLD);
  doc.registerFont('Italic', NOTO_ITALIC);
}

/**
 * Loads a hospital logo for embedding in a PDF: from our storage bucket, or a
 * legacy local `/uploads/...` path. Returns null unless it's a PNG/JPEG (the
 * only formats PDFKit embeds), so callers fall back to initials.
 */
export async function loadTenantLogo(
  storage: StorageService,
  logoUrl?: string | null,
): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    let buf: Buffer | null = null;
    if (logoUrl.startsWith('/uploads/')) {
      const file = path.join(
        getUploadsBasePath(),
        path
          .normalize(logoUrl.replace(/^\/uploads\//, ''))
          .replace(/^(\.\.[/\\])+/, ''),
      );
      if (fs.existsSync(file)) buf = fs.readFileSync(file);
    } else {
      buf = await storage.downloadByPublicUrl(logoUrl);
    }
    if (!buf) return null;
    const isPng = buf
      .subarray(0, 4)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    return isPng || isJpeg ? buf : null;
  } catch {
    return null;
  }
}
