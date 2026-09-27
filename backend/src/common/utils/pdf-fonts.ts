import * as fs from 'fs';
import * as path from 'path';

// Literal file names so Vercel's file tracer bundles the fonts with the function.
const FONTS: Record<string, [string, string]> = {
  Body: [
    path.join(process.cwd(), 'assets', 'NotoSans-Regular.ttf'),
    'Helvetica',
  ],
  Bold: [
    path.join(process.cwd(), 'assets', 'NotoSans-Bold.ttf'),
    'Helvetica-Bold',
  ],
  Italic: [
    path.join(process.cwd(), 'assets', 'NotoSans-Italic.ttf'),
    'Helvetica-Oblique',
  ],
};

/**
 * Registers the 'Body' / 'Bold' / 'Italic' fonts on a PDFKit doc.
 * Returns false when the Noto TTFs are missing and built-in Helvetica was
 * used instead — Helvetica has no ₹ glyph, so callers should print "Rs.".
 */
export function registerPdfFonts(doc: any): boolean {
  const ok = Object.values(FONTS).every(([file]) => fs.existsSync(file));
  for (const [name, [file, fallback]] of Object.entries(FONTS)) {
    doc.registerFont(name, ok ? file : fallback);
  }
  return ok;
}
