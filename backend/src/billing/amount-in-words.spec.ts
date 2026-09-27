import { amountInWords } from './billing.service';

describe('amountInWords', () => {
  it('uses Indian numbering with paise', () => {
    expect(amountInWords(0)).toBe('Rupees Zero Only');
    expect(amountInWords(500)).toBe('Rupees Five Hundred Only');
    expect(amountInWords('1219.50')).toBe(
      'Rupees One Thousand Two Hundred Nineteen and Fifty Paise Only',
    );
    expect(amountInWords(12345678)).toBe(
      'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only',
    );
  });
});
