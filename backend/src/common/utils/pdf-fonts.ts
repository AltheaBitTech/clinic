import { NOTO_BOLD, NOTO_ITALIC, NOTO_REGULAR } from './pdf-assets';

export { AROGYIX_WORDMARK_PNG } from './pdf-assets';

/** Registers the embedded 'Body' / 'Bold' / 'Italic' fonts on a PDFKit doc. */
export function registerPdfFonts(doc: any): void {
  doc.registerFont('Body', NOTO_REGULAR);
  doc.registerFont('Bold', NOTO_BOLD);
  doc.registerFont('Italic', NOTO_ITALIC);
}
