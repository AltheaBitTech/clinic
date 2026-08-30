import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Razorpay from 'razorpay';

// Constructed lazily, on first real use, rather than eagerly at module
// bootstrap: the Razorpay SDK throws if key_id/key_secret are unset, and
// requiring those to be configured just to boot the app (before anyone has
// actually set up a Razorpay account) would take down every other module.
@Injectable()
export class RazorpayService {
  private _client: Razorpay | null = null;

  get client(): Razorpay {
    if (!this._client) {
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_id || !key_secret) {
        throw new ServiceUnavailableException(
          'Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)',
        );
      }
      this._client = new Razorpay({ key_id, key_secret });
    }
    return this._client;
  }
}
