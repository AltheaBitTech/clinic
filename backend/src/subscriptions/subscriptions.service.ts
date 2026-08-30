import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';

// Razorpay's Subscriptions API requires a finite total_count even for plans
// that should recur indefinitely until cancelled. 120 monthly cycles (10
// years) is the documented practical stand-in for "indefinite" — it is not
// a hard cap on how long a tenant can stay subscribed.
const INDEFINITE_TOTAL_COUNT = 120;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
  ) {}

  getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ priceInPaise: 'asc' }],
    });
  }

  async getCurrent(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (subscription) return subscription;

    // Tenants can end up with a subscriptionPlan set (e.g. picked on the
    // landing page and applied when their TenantRequest was approved, see
    // tenant-requests.service.ts) without ever going through checkout, so
    // no Subscription row exists yet. Fall back to the tenant's tier so the
    // matching plan still shows as "current" instead of none at all.
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;

    const plan = await this.prisma.plan.findFirst({
      where: { tier: tenant.subscriptionPlan, isActive: true },
      orderBy: { priceInPaise: 'asc' },
    });
    if (!plan) return null;

    return {
      id: null,
      tenantId,
      planId: plan.id,
      plan,
      razorpaySubscriptionId: null,
      razorpayCustomerId: null,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: null,
      currentPeriodEnd: tenant.subscriptionEndsAt,
      cancelAtPeriodEnd: false,
      shortUrl: null,
      notes: null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async createCheckout(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan not found');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (plan.tier === 'FREE') {
      await this.prisma.subscription.create({
        data: {
          tenantId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
        },
      });
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { subscriptionPlan: 'FREE', subscriptionEndsAt: null },
      });
      return { razorpaySubscriptionId: null };
    }

    if (!plan.razorpayPlanId) {
      throw new NotFoundException('Plan is not configured for checkout');
    }

    const previous = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // The tenant's Razorpay customer can predate the most recent subscription
    // row (e.g. they downgraded to FREE, which never stores a customer id),
    // so look across all of the tenant's subscriptions rather than just the
    // latest one — otherwise we'd try to create a duplicate customer and
    // Razorpay would reject it with "Customer already exists for the merchant".
    const existingCustomer = previous?.razorpayCustomerId
      ? previous
      : await this.prisma.subscription.findFirst({
          where: { tenantId, razorpayCustomerId: { not: null } },
          orderBy: { createdAt: 'desc' },
        });

    let razorpayCustomerId = existingCustomer?.razorpayCustomerId ?? undefined;
    if (!razorpayCustomerId) {
      const customer = await this.razorpay.client.customers.create({
        name: tenant.name,
        email: tenant.email,
        contact: tenant.phone || undefined,
        notes: { tenantId },
      });
      razorpayCustomerId = customer.id;
    }

    // Never leave two overlapping Razorpay subscriptions active for the same
    // tenant when switching plans.
    const nonTerminalStatuses: SubscriptionStatus[] = [
      SubscriptionStatus.CREATED,
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PENDING,
    ];
    if (
      previous?.razorpaySubscriptionId &&
      nonTerminalStatuses.includes(previous.status)
    ) {
      try {
        await this.razorpay.client.subscriptions.cancel(previous.razorpaySubscriptionId);
      } catch (err) {
        this.logger.warn(
          `Failed to cancel previous Razorpay subscription ${previous.razorpaySubscriptionId}: ${err}`,
        );
      }
      await this.prisma.subscription.update({
        where: { id: previous.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    }

    const razorpaySubscription = await this.razorpay.client.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: INDEFINITE_TOTAL_COUNT,
      notes: { tenantId, planId },
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayCustomerId,
        status: SubscriptionStatus.CREATED,
        shortUrl: razorpaySubscription.short_url,
        notes: { tenantId, planId },
      },
    });

    return {
      subscriptionId: subscription.id,
      razorpaySubscriptionId: razorpaySubscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      shortUrl: razorpaySubscription.short_url,
      amount: plan.priceInPaise,
      currency: plan.currency,
    };
  }

  async cancelSubscription(tenantId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (!subscription.razorpaySubscriptionId) {
      throw new NotFoundException('Subscription has no gateway record to cancel');
    }

    await this.razorpay.client.subscriptions.cancel(
      subscription.razorpaySubscriptionId,
      true,
    );

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async processWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
    parsedBody: any,
  ): Promise<{ received: true }> {
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured (missing RAZORPAY_WEBHOOK_SECRET)',
      );
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    const valid =
      signatureBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(signatureBuf, expectedBuf);
    if (!valid) throw new UnauthorizedException('Invalid webhook signature');

    const eventId: string =
      parsedBody?.id ?? crypto.createHash('sha256').update(rawBody).digest('hex');

    try {
      await this.prisma.webhookEvent.create({
        data: {
          eventId,
          eventType: parsedBody?.event ?? 'unknown',
          payload: parsedBody,
        },
      });
    } catch {
      // Unique constraint on eventId => already processed; ack without redoing work.
      return { received: true };
    }

    try {
      await this.handleEvent(parsedBody);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { processedAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Failed to process webhook ${eventId}: ${err?.message}`);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { error: String(err?.message ?? err) },
      });
    }

    return { received: true };
  }

  private async handleEvent(body: any) {
    const event: string = body?.event;
    const entity = body?.payload?.subscription?.entity;
    if (!entity?.id) return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: entity.id },
      include: { plan: true },
    });
    if (!subscription) {
      this.logger.warn(`Webhook ${event} for unknown subscription ${entity.id}`);
      return;
    }

    const periodStart = entity.current_start ? new Date(entity.current_start * 1000) : undefined;
    const periodEnd = entity.current_end ? new Date(entity.current_end * 1000) : undefined;

    switch (event) {
      case 'subscription.authenticated':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.CREATED },
        });
        break;

      case 'subscription.activated':
      case 'subscription.charged':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
        await this.prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: {
            subscriptionPlan: subscription.plan.tier,
            subscriptionEndsAt: periodEnd,
          },
        });
        break;

      case 'subscription.pending':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.PENDING },
        });
        break;

      case 'subscription.halted':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.HALTED },
        });
        break;

      case 'subscription.cancelled':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.CANCELLED },
        });
        break;

      case 'subscription.completed':
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.COMPLETED },
        });
        break;

      default:
        // Other events (e.g. payment.failed, subscription.updated) are logged
        // via the WebhookEvent audit row but need no bespoke handling yet.
        break;
    }
  }
}
