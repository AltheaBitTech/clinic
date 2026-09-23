export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ];
  return lines.join('\n');
}

export function buildTablePdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  summary?: { label: string; value: string }[],
): Promise<Buffer> {
  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'landscape',
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const marginX = doc.page.margins.left;
    const contentWidth = doc.page.width - marginX * 2;
    const colWidth = contentWidth / headers.length;
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    const drawRow = (
      cells: (string | number | null | undefined)[],
      bold = false,
    ) => {
      if (doc.y > bottomLimit - 20) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      cells.forEach((c, i) => {
        doc.text(String(c ?? ''), marginX + i * colWidth, y, {
          width: colWidth - 6,
          ellipsis: true,
        });
      });
      doc.y = y + 14;
    };

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0e7490').text(title);
    doc.fillColor('black').font('Helvetica').fontSize(9).text(subtitle);
    doc.moveDown(0.5);

    if (summary?.length) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(summary.map((s) => `${s.label}: ${s.value}`).join('    |    '));
      doc.moveDown(0.6);
    }

    drawRow(headers, true);
    doc
      .strokeColor('#ccc')
      .moveTo(marginX, doc.y)
      .lineTo(marginX + contentWidth, doc.y)
      .stroke();
    doc.strokeColor('black');
    doc.y += 4;

    rows.forEach((r) => drawRow(r));

    doc.end();
  });
}
