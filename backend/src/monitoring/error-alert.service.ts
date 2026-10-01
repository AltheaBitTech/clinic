import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

export type ErrorAlertContext = {
  // 'http' | 'client' | 'process' | 'cron:<name>' | 'outbound:<provider>'
  source: string;
  method?: string;
  route?: string;
  status?: number;
  tenantId?: string | null;
  userId?: string | null;
  role?: string | null;
  requestId?: string;
  // Non-PHI identifiers only (record IDs, provider status codes, etc.)
  extra?: Record<string, string | number | boolean | null | undefined>;
};

type NormalizedError = {
  name: string;
  message: string;
  stack: string;
  causes: string[];
  prisma?: { code?: string; meta?: unknown };
};

const SEND_TIMEOUT_MS = 3000;
const MAX_STACK_FRAMES = 15;
const DEFAULT_COOLDOWN_MINUTES = 60;

/**
 * Emails the team when something breaks in production, so issues are known
 * before a hospital reports them. Deduplicated by fingerprint in the
 * `error_events` table (in-memory state doesn't survive Vercel's serverless
 * instances). Never throws — alerting must not break the request it observes.
 *
 * Deliberately never includes request bodies, query strings or headers:
 * those can carry patient data.
 */
@Injectable()
export class ErrorAlertService {
  private readonly logger = new Logger(ErrorAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async report(error: unknown, ctx: ErrorAlertContext): Promise<void> {
    try {
      await this.withTimeout(this.process(error, ctx), SEND_TIMEOUT_MS);
    } catch (alertError) {
      const message =
        alertError instanceof Error ? alertError.message : String(alertError);
      this.logger.error(`Failed to process error alert: ${message}`);
    }
  }

  private async process(error: unknown, ctx: ErrorAlertContext) {
    const normalized = this.normalize(error);
    this.logger.error(
      `[${ctx.source}] ${ctx.method ?? ''} ${ctx.route ?? ''} ${normalized.name}: ${normalized.message}`.replace(
        /\s+/g,
        ' ',
      ),
      normalized.stack,
    );

    const fingerprint = this.fingerprint(normalized, ctx);
    const event = await this.prisma.errorEvent.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        source: ctx.source,
        name: normalized.name.slice(0, 200),
        message: normalized.message.slice(0, 1000),
        route: ctx.route ? `${ctx.method ?? ''} ${ctx.route}`.trim() : null,
        lastStack: normalized.stack.slice(0, 8000),
      },
      update: {
        count: { increment: 1 },
        lastSeenAt: new Date(),
        lastStack: normalized.stack.slice(0, 8000),
      },
    });

    const cooldownMs = this.cooldownMinutes() * 60_000;
    const due =
      !event.lastAlertedAt ||
      Date.now() - event.lastAlertedAt.getTime() >= cooldownMs;
    if (!due) return;

    // Claim the alert atomically so concurrent instances don't both send.
    const claimed = await this.prisma.errorEvent.updateMany({
      where: {
        id: event.id,
        OR: [
          { lastAlertedAt: null },
          { lastAlertedAt: { lte: new Date(Date.now() - cooldownMs) } },
        ],
      },
      data: { lastAlertedAt: new Date() },
    });
    if (claimed.count === 0) return;

    const tenantName = ctx.tenantId
      ? await this.prisma.tenant
          .findUnique({ where: { id: ctx.tenantId }, select: { name: true } })
          .then((t) => t?.name)
          .catch(() => undefined)
      : undefined;

    const { subject, text, html } = this.compose(normalized, ctx, {
      count: event.count,
      firstSeenAt: event.firstSeenAt,
      previouslyAlerted: !!event.lastAlertedAt,
      tenantName,
    });
    await this.send(subject, text, html);
  }

  private normalize(error: unknown): NormalizedError {
    const err =
      error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : JSON.stringify(error));

    const causes: string[] = [];
    let cause = (err as { cause?: unknown }).cause;
    for (let depth = 0; cause && depth < 5; depth++) {
      causes.push(
        cause instanceof Error
          ? `${cause.name}: ${cause.message}`
          : String(cause),
      );
      cause = cause instanceof Error ? (cause as { cause?: unknown }).cause : undefined;
    }

    const normalized: NormalizedError = {
      name: err.name || 'Error',
      message: err.message || '(no message)',
      stack: err.stack ?? `${err.name}: ${err.message}`,
      causes,
    };
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      normalized.prisma = { code: err.code, meta: err.meta };
    }
    return normalized;
  }

  fingerprint(error: NormalizedError, ctx: ErrorAlertContext): string {
    const message = error.message
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '<uuid>',
      )
      .replace(/\bc[a-z0-9]{20,30}\b/g, '<cuid>')
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '<email>')
      .replace(/\d+/g, '<n>');
    return createHash('sha1')
      .update(
        [
          ctx.source,
          ctx.route ?? '',
          error.name,
          message,
          this.causeFrame(error.stack) ?? '',
        ].join('|'),
      )
      .digest('hex');
  }

  /** First stack frame inside our own code — usually where to start looking. */
  causeFrame(stack: string): string | undefined {
    const frames = stack
      .split('\n')
      .slice(1)
      .filter((line) => !line.includes('node_modules') && !line.includes('node:'));
    // Backend paths first, so '/app/src/x.ts' resolves to 'src/x.ts'; then
    // frontend source paths from browser stacks.
    for (const pattern of [
      /((?:src|dist)\/[^\s():?]+):(\d+)/,
      /((?:app|components|lib)\/[^\s():?]+):(\d+)/,
    ]) {
      for (const line of frames) {
        const match = line.match(pattern);
        if (match) return `${match[1]}:${match[2]}`;
      }
    }
    return undefined;
  }

  compose(
    error: NormalizedError,
    ctx: ErrorAlertContext,
    meta: {
      count: number;
      firstSeenAt: Date;
      previouslyAlerted: boolean;
      tenantName?: string;
    },
  ) {
    const env =
      this.config.get<string>('APP_ENV_LABEL') ||
      this.config.get<string>('NODE_ENV') ||
      'unknown';
    const where = [ctx.status, ctx.method, ctx.route].filter(Boolean).join(' ');
    const subject = `[Arogyix][${env}] ${where || ctx.source}: ${error.name}: ${error.message}`
      .replace(/\s+/g, ' ')
      .slice(0, 200);

    const frames = error.stack
      .split('\n')
      .slice(0, MAX_STACK_FRAMES + 1)
      .join('\n');

    const rows: [string, string][] = [
      ['Source', ctx.source],
      ['Likely cause', this.causeFrame(error.stack) ?? 'n/a (no app frame in stack)'],
      ['Error', `${error.name}: ${error.message}`],
    ];
    if (error.causes.length) rows.push(['Caused by', error.causes.join(' ← ')]);
    if (error.prisma) {
      rows.push([
        'Prisma',
        `code=${error.prisma.code ?? 'n/a'} meta=${JSON.stringify(error.prisma.meta ?? {})}`,
      ]);
    }
    if (where) rows.push(['Request', where]);
    if (ctx.requestId) rows.push(['Request ID', ctx.requestId]);
    if (ctx.tenantId) {
      rows.push([
        'Tenant',
        meta.tenantName ? `${meta.tenantName} (${ctx.tenantId})` : ctx.tenantId,
      ]);
    }
    if (ctx.userId) {
      rows.push(['User', `${ctx.userId}${ctx.role ? ` (${ctx.role})` : ''}`]);
    }
    for (const [key, value] of Object.entries(ctx.extra ?? {})) {
      if (value !== undefined && value !== null) rows.push([key, String(value)]);
    }
    rows.push(['Environment', env]);
    rows.push(['First seen', meta.firstSeenAt.toISOString()]);
    rows.push([
      'Occurrences',
      meta.previouslyAlerted
        ? `${meta.count} total (repeat alert — cooldown ${this.cooldownMinutes()} min)`
        : `${meta.count} (first alert)`,
    ]);
    rows.push(['Alerted at', new Date().toISOString()]);

    const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nStack trace:\n${frames}\n`;
    const html = `<table cellpadding="4" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="vertical-align:top;color:#555;white-space:nowrap"><strong>${this.escapeHtml(k)}</strong></td><td>${this.escapeHtml(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<h4 style="font-family:sans-serif">Stack trace</h4>
<pre style="background:#f5f5f5;padding:12px;font-size:12px;overflow:auto">${this.escapeHtml(frames)}</pre>`;

    return { subject, text, html };
  }

  private async send(subject: string, text: string, html: string) {
    const recipients = (this.config.get<string>('ALERT_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('RESEND_FROM_EMAIL')?.trim();

    if (!this.enabled() || !recipients.length || !apiKey || !from) {
      this.logger.warn(
        `Error alert not emailed (alerts disabled or ALERT_EMAILS/Resend not configured):\n${subject}\n${text}`,
      );
      return;
    }

    const result = await this.createResendClient(apiKey).emails.send({
      from,
      to: recipients,
      subject,
      text,
      html,
    });
    if (result.error) {
      throw new Error(`Resend rejected error alert: ${result.error.message}`);
    }
  }

  createResendClient(apiKey: string): Resend {
    return new Resend(apiKey);
  }

  private enabled(): boolean {
    const flag = this.config.get<string>('ALERTS_ENABLED')?.trim().toLowerCase();
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private cooldownMinutes(): number {
    const value = Number(this.config.get<string>('ALERT_COOLDOWN_MINUTES'));
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_COOLDOWN_MINUTES;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
