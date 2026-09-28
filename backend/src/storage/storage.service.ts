import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || '';

    this.client =
      url && serviceRoleKey ? createClient(url, serviceRoleKey) : null;

    if (!this.client) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — document uploads will fail',
      );
    }
  }

  get isConfigured(): boolean {
    return !!this.client && !!this.bucket;
  }

  /**
   * Uploads a buffer to the configured Supabase Storage bucket and returns
   * its public URL. `path` is the object key within the bucket, e.g.
   * `reports/<tenantId>/<uuid>-<originalname>`.
   */
  async uploadBuffer(
    path: string,
    buffer: Buffer,
    contentType?: string,
    options?: { upsert?: boolean },
  ): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Document storage is not configured on this server',
      );
    }

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: options?.upsert ?? false,
      });

    if (error) {
      this.logger.error(`Supabase upload failed for ${path}: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload document');
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Given a public URL previously returned by `uploadBuffer`, recovers the
   * bucket-relative object path so it can be passed to `deleteFile`. Returns
   * null for anything that isn't a Supabase Storage public URL for the
   * configured bucket (e.g. a legacy local `/uploads/...` path).
   */
  pathFromPublicUrl(url: string): string | null {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.slice(index + marker.length));
  }

  /**
   * Downloads an object previously returned by `uploadBuffer`. Only URLs that
   * point into the configured bucket are fetched (via the storage client, not
   * an arbitrary HTTP request), so a user-supplied URL can't make the server
   * call out elsewhere. Returns null when missing or not ours.
   */
  async downloadByPublicUrl(url: string): Promise<Buffer | null> {
    const objectPath = this.pathFromPublicUrl(url);
    if (!this.client || !objectPath) return null;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(objectPath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.client) return;
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);
    if (error) {
      this.logger.error(`Supabase delete failed for ${path}: ${error.message}`);
    }
  }
}
