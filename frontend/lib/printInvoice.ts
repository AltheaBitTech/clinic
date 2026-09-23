import { formatCurrency, formatDateTime } from './utils';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const lineAmount = (item: any) => Number(item.unitPrice) * item.quantity;
const lineTotal = (item: any) => lineAmount(item) - Number(item.discount || 0) + Number(item.tax || 0);

/** Opens a print-ready invoice for a pharmacy sale in a new window and triggers the browser print dialog. */
export function printSaleInvoice(sale: any, pharmacy?: any) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;

  const itemsHtml = (sale.items || [])
    .map(
      (item: any) => `
      <tr>
        <td>${escapeHtml(item.medicine?.name || item.medicineId)}</td>
        <td class="num">${escapeHtml(String(item.quantity))}</td>
        <td class="num">${escapeHtml(formatCurrency(item.unitPrice))}</td>
        <td class="num">${escapeHtml(formatCurrency(item.discount || 0))}</td>
        <td class="num">${escapeHtml(formatCurrency(item.tax || 0))}</td>
        <td class="num">${escapeHtml(formatCurrency(lineTotal(item)))}</td>
      </tr>`,
    )
    .join('');

  const customerName = sale.patient?.name || 'Walk-in Customer';
  const customerPhone = sale.patient?.phone ? ` · ${sale.patient.phone}` : '';
  const pharmacyContact = [pharmacy?.phone, pharmacy?.email].filter(Boolean).join(' · ');

  win.document.write(`<!doctype html><html><head><title>Invoice ${escapeHtml(sale.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0e7490; padding-bottom: 16px; margin-bottom: 20px; }
  .pharmacy-name { font-size: 20px; font-weight: 800; color: #0e7490; margin: 0; }
  .pharmacy-meta { font-size: 11px; color: #64748b; margin: 2px 0 0; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 16px; margin: 0; letter-spacing: 0.05em; text-transform: uppercase; color: #1e293b; }
  .invoice-title p { font-size: 12px; color: #64748b; margin: 2px 0 0; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; font-size: 12px; }
  .meta-grid .label { color: #94a3b8; text-transform: uppercase; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; display: block; }
  .meta-grid .value { font-weight: 600; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f1f5f9; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  th.num, td.num { text-align: right; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .totals { width: 260px; margin-left: auto; font-size: 12px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .row.grand { border-top: 2px solid #0e7490; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 800; color: #0e7490; }
  .footer-note { margin-top: 28px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 12px; } }
</style></head>
<body>
  <div class="header">
    <div>
      <p class="pharmacy-name">${escapeHtml(pharmacy?.name || 'Pharmacy')}</p>
      ${pharmacy?.address ? `<p class="pharmacy-meta">${escapeHtml(pharmacy.address)}</p>` : ''}
      ${pharmacyContact ? `<p class="pharmacy-meta">${escapeHtml(pharmacyContact)}</p>` : ''}
    </div>
    <div class="invoice-title">
      <h1>Invoice</h1>
      <p>${escapeHtml(sale.invoiceNo)}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div><span class="label">Invoice No.</span><span class="value">${escapeHtml(sale.invoiceNo)}</span></div>
    <div><span class="label">Date</span><span class="value">${escapeHtml(formatDateTime(sale.createdAt))}</span></div>
    <div><span class="label">Customer</span><span class="value">${escapeHtml(customerName)}${escapeHtml(customerPhone)}</span></div>
    <div><span class="label">Payment Status</span><span class="value">${escapeHtml(sale.paymentStatus)}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Medicine / Item</th>
        <th class="num">Qty</th>
        <th class="num">Price</th>
        <th class="num">Discount</th>
        <th class="num">Tax</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(sale.subtotal))}</span></div>
    <div class="row"><span>Discount</span><span>-${escapeHtml(formatCurrency(sale.discount))}</span></div>
    <div class="row"><span>Tax</span><span>${escapeHtml(formatCurrency(sale.tax))}</span></div>
    <div class="row grand"><span>Total</span><span>${escapeHtml(formatCurrency(sale.total))}</span></div>
  </div>

  <p class="footer-note">Thank you for your purchase. This is a computer-generated invoice.</p>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
