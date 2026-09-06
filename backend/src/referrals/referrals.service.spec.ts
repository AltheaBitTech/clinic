/* eslint-disable @typescript-eslint/require-await */
import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';

describe('ReferralsService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    referral: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    emailRegistrationChallenge: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let emailService: {
    sendReferralRequestSubmitted: jest.Mock;
    sendReferralApproved: jest.Mock;
    sendReferralRejected: jest.Mock;
  };
  let authService: { assertRegisterEmailVerified: jest.Mock };
  let service: ReferralsService;

  const registerDto = {
    email: 'referrer@example.com',
    firstName: 'Ref',
    lastName: 'Erral',
    password: 'password123',
    emailVerificationToken: 'proof-token',
  };

  const createdUser = {
    id: 'user_1',
    email: 'referrer@example.com',
    firstName: 'Ref',
    lastName: 'Erral',
  };

  function mockSuccessfulRegisterTransaction() {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          emailRegistrationChallenge: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          referral: { create: jest.fn().mockResolvedValue({ id: 'ref_1' }) },
        };
        return fn(tx);
      },
    );
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
      referral: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      emailRegistrationChallenge: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    emailService = {
      sendReferralRequestSubmitted: jest.fn().mockResolvedValue(undefined),
      sendReferralApproved: jest.fn().mockResolvedValue(undefined),
      sendReferralRejected: jest.fn().mockResolvedValue(undefined),
    };
    authService = {
      assertRegisterEmailVerified: jest.fn().mockResolvedValue('chal_1'),
    };
    service = new ReferralsService(
      prisma as unknown as PrismaService,
      emailService as unknown as EmailService,
      authService as unknown as AuthService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates a PENDING, inactive referral user and notifies super admins', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // existing-email check
      prisma.user.findMany.mockResolvedValue([{ email: 'admin@example.com' }]);
      mockSuccessfulRegisterTransaction();

      const result = await service.register(registerDto);

      expect(authService.assertRegisterEmailVerified).toHaveBeenCalledWith(
        'referrer@example.com',
        'proof-token',
      );
      expect(emailService.sendReferralRequestSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({ recipientEmail: 'admin@example.com' }),
      );
      expect(result.message).toMatch(/awaiting Super Admin approval/);
    });

    it('rejects an email that is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(authService.assertRegisterEmailVerified).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('generates a unique code and activates the user from PENDING', async () => {
      prisma.referral.findUnique
        .mockResolvedValueOnce({
          id: 'ref_1',
          userId: 'user_1',
          status: 'PENDING',
          referralCode: null,
        })
        .mockResolvedValueOnce(null); // code-uniqueness check passes first try
      prisma.$transaction.mockResolvedValue([
        {},
        { id: 'ref_1', status: 'APPROVED', referralCode: 'REF-ABC123' },
      ]);
      prisma.user.findUnique.mockResolvedValue(createdUser);

      const result = await service.approve('ref_1', 'admin_1');

      expect(result.status).toBe('APPROVED');
      expect(emailService.sendReferralApproved).toHaveBeenCalledWith(
        expect.objectContaining({ recipientEmail: 'referrer@example.com' }),
      );
    });

    it('allows re-approving a previously REJECTED referral', async () => {
      prisma.referral.findUnique
        .mockResolvedValueOnce({
          id: 'ref_1',
          userId: 'user_1',
          status: 'REJECTED',
          referralCode: null,
        })
        .mockResolvedValueOnce(null);
      prisma.$transaction.mockResolvedValue([
        {},
        { id: 'ref_1', status: 'APPROVED', referralCode: 'REF-XYZ999' },
      ]);
      prisma.user.findUnique.mockResolvedValue(createdUser);

      const result = await service.approve('ref_1', 'admin_1');
      expect(result.status).toBe('APPROVED');
    });

    it('rejects approving an already-APPROVED referral', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        userId: 'user_1',
        status: 'APPROVED',
        referralCode: 'REF-OLD111',
      });

      await expect(service.approve('ref_1', 'admin_1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('rejects a PENDING referral and notifies the applicant', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        userId: 'user_1',
        status: 'PENDING',
      });
      prisma.referral.update.mockResolvedValue({
        id: 'ref_1',
        status: 'REJECTED',
      });
      prisma.user.findUnique.mockResolvedValue(createdUser);

      const result = await service.reject('ref_1', 'admin_1');

      expect(result.status).toBe('REJECTED');
      expect(emailService.sendReferralRejected).toHaveBeenCalledWith(
        expect.objectContaining({ recipientEmail: 'referrer@example.com' }),
      );
    });

    it('refuses to reject a non-PENDING referral', async () => {
      prisma.referral.findUnique.mockResolvedValue({
        id: 'ref_1',
        userId: 'user_1',
        status: 'APPROVED',
      });

      await expect(service.reject('ref_1', 'admin_1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
