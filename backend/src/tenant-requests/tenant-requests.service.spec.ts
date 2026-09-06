/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Logger } from '@nestjs/common';
import { TenantRequestsService } from './tenant-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('TenantRequestsService referral attribution', () => {
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock };
    tenantRequest: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    referral: { findUnique: jest.Mock };
    tenant: { findUnique: jest.Mock; create: jest.Mock };
  };
  let emailService: {
    sendTenantRequestSubmitted: jest.Mock;
    sendRegistrationWelcome: jest.Mock;
    sendReferralCodeUsed: jest.Mock;
  };
  let service: TenantRequestsService;

  const baseDto = {
    name: 'City Clinic',
    email: 'admin@cityclinic.example',
    firstName: 'Ada',
    lastName: 'Lovelace',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      tenantRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      referral: { findUnique: jest.fn() },
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    emailService = {
      sendTenantRequestSubmitted: jest.fn().mockResolvedValue(undefined),
      sendRegistrationWelcome: jest.fn().mockResolvedValue(undefined),
      sendReferralCodeUsed: jest.fn().mockResolvedValue(undefined),
    };
    service = new TenantRequestsService(
      prisma as unknown as PrismaService,
      emailService as unknown as EmailService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('resolves a valid approved referral code onto the request', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        status: 'APPROVED',
        kycStatus: 'APPROVED',
      });
      prisma.tenantRequest.create.mockResolvedValue({ id: 'req_1' });

      await service.create({ ...baseDto, referralCode: 'REF-AB12CD' });

      expect(prisma.tenantRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referredById: 'ref_1' }),
        }),
      );
    });

    it('rejects an unknown referral code', async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...baseDto, referralCode: 'BOGUS' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.tenantRequest.create).not.toHaveBeenCalled();
    });

    it('rejects a referral code that is not yet approved', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        status: 'PENDING',
        kycStatus: 'NOT_SUBMITTED',
      });

      await expect(
        service.create({ ...baseDto, referralCode: 'REF-AB12CD' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a referral code whose KYC is not yet approved', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        status: 'APPROVED',
        kycStatus: 'PENDING',
      });

      await expect(
        service.create({ ...baseDto, referralCode: 'REF-AB12CD' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('skips referral resolution when no code is given', async () => {
      prisma.tenantRequest.create.mockResolvedValue({ id: 'req_1' });

      await service.create({ ...baseDto });

      expect(prisma.referral.findUnique).not.toHaveBeenCalled();
      expect(prisma.tenantRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referredById: null }),
        }),
      );
    });
  });

  describe('approve', () => {
    it('propagates referredById onto the tenant and notifies the referrer', async () => {
      prisma.tenantRequest.findUnique.mockResolvedValue({
        id: 'req_1',
        type: 'HOSPITAL',
        status: 'PENDING',
        name: 'City Clinic',
        email: 'admin@cityclinic.example',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: null,
        address: null,
        city: null,
        state: null,
        plan: 'FREE',
        referredById: 'ref_1',
      });
      prisma.tenant.create.mockResolvedValue({
        id: 'tenant_1',
        name: 'City Clinic',
        slug: 'city-clinic',
        type: 'HOSPITAL',
      });
      prisma.user.create.mockResolvedValue({
        id: 'user_1',
        email: 'admin@cityclinic.example',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'HOSPITAL_ADMIN',
      });
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        user: {
          email: 'referrer@example.com',
          firstName: 'Ref',
          lastName: 'Erral',
        },
      });

      await service.approve('req_1');

      expect(prisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referredById: 'ref_1' }),
        }),
      );
      expect(emailService.sendReferralCodeUsed).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'referrer@example.com',
          tenantName: 'City Clinic',
          tenantType: 'HOSPITAL',
        }),
      );
    });

    it('does not attempt referral notification when the request has no referrer', async () => {
      prisma.tenantRequest.findUnique.mockResolvedValue({
        id: 'req_2',
        type: 'HOSPITAL',
        status: 'PENDING',
        name: 'Other Clinic',
        email: 'admin@otherclinic.example',
        firstName: 'Bob',
        lastName: 'Builder',
        phone: null,
        address: null,
        city: null,
        state: null,
        plan: 'FREE',
        referredById: null,
      });
      prisma.tenant.create.mockResolvedValue({
        id: 'tenant_2',
        name: 'Other Clinic',
        slug: 'other-clinic',
        type: 'HOSPITAL',
      });
      prisma.user.create.mockResolvedValue({
        id: 'user_2',
        email: 'admin@otherclinic.example',
        firstName: 'Bob',
        lastName: 'Builder',
        role: 'HOSPITAL_ADMIN',
      });

      await service.approve('req_2');

      expect(prisma.referral.findUnique).not.toHaveBeenCalled();
      expect(emailService.sendReferralCodeUsed).not.toHaveBeenCalled();
    });
  });
});
