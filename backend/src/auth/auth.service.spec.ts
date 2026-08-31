/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService registration emails', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    tenant: { findUnique: jest.Mock };
    hospitalInvite: { findUnique: jest.Mock; update: jest.Mock };
    emailRegistrationChallenge: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let emailService: {
    sendRegistrationWelcome: jest.Mock;
    sendEmailVerificationOtp: jest.Mock;
  };
  let service: AuthService;

  const createdUser = {
    id: 'user_1',
    email: 'newpatient@example.com',
    firstName: 'New',
    lastName: 'Patient',
    role: 'PATIENT',
    tenantId: 'tenant_1',
    tenant: {
      id: 'tenant_1',
      name: 'Arogyix Clinic',
      slug: 'arogyix',
      logoUrl: null,
    },
    doctor: null,
    patient: { id: 'pat_1' },
    pharmacy: null,
    passwordHash: 'hash',
    refreshToken: null,
    otp: null,
    otpExpiresAt: null,
  };

  const registerDto = {
    email: 'newpatient@example.com',
    firstName: 'New',
    lastName: 'Patient',
    password: 'password123',
    tenantId: 'tenant_1',
    emailVerificationToken: 'proof-token',
  };

  const verifiedChallenge = {
    id: 'chal_1',
    email: 'newpatient@example.com',
    otpHash: 'hashed',
    expiresAt: new Date(Date.now() + 60_000),
    attemptCount: 0,
    verifiedAt: new Date(),
    consumedAt: null,
    lastSentAt: new Date(),
  };

  function mockSuccessfulRegisterTransaction(updateManyCount = 1) {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          emailRegistrationChallenge: {
            updateMany: jest.fn().mockResolvedValue({ count: updateManyCount }),
          },
          user: {
            create: jest.fn().mockResolvedValue(createdUser),
            findUniqueOrThrow: jest.fn().mockResolvedValue(createdUser),
          },
          patient: { create: jest.fn().mockResolvedValue({ id: 'pat_1' }) },
          patientTimeline: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      },
    );
  }

  function mockValidProof() {
    jwtService.verifyAsync.mockResolvedValue({
      purpose: 'register_email',
      email: 'newpatient@example.com',
      jti: 'chal_1',
    });
    prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
      verifiedChallenge,
    );
  }

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant_1',
          name: 'Arogyix Clinic',
          isActive: true,
        }),
      },
      hospitalInvite: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      emailRegistrationChallenge: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn(),
    };
    emailService = {
      sendRegistrationWelcome: jest.fn().mockResolvedValue(undefined),
      sendEmailVerificationOtp: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      emailService as unknown as EmailService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successful patient registration sends welcome email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    mockValidProof();
    mockSuccessfulRegisterTransaction();

    const result = await service.register(registerDto);

    expect(result.user.email).toBe('newpatient@example.com');
    expect(result.user.role).toBe('PATIENT');
    expect(result.user.tenantId).toBe('tenant_1');
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
    expect(emailService.sendRegistrationWelcome).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'newpatient@example.com',
        role: 'PATIENT',
        hospitalName: 'Arogyix Clinic',
      }),
    );
  });

  it('doctor invite accept sends doctor role welcome', async () => {
    prisma.hospitalInvite.findUnique.mockResolvedValue({
      id: 'inv_1',
      email: 'doc@example.com',
      role: 'DOCTOR',
      tenantId: 'tenant_1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      tenant: { id: 'tenant_1', name: 'Arogyix Clinic' },
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...createdUser,
      email: 'doc@example.com',
      role: 'DOCTOR',
      firstName: 'Doc',
      lastName: 'Tor',
    });

    await service.acceptInvite({
      token: 'tok',
      password: 'password123',
      firstName: 'Doc',
      lastName: 'Tor',
    });

    expect(emailService.sendRegistrationWelcome).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'doc@example.com',
        role: 'DOCTOR',
        hospitalName: 'Arogyix Clinic',
      }),
    );
    expect(emailService.sendEmailVerificationOtp).not.toHaveBeenCalled();
  });

  it('Resend failure does not break registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    mockValidProof();
    mockSuccessfulRegisterTransaction();
    emailService.sendRegistrationWelcome.mockRejectedValue(
      new Error('Resend down'),
    );

    const result = await service.register(registerDto);

    expect(result.user.email).toBe('newpatient@example.com');
  });

  it('existing registration validation failure remains unchanged', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(emailService.sendRegistrationWelcome).not.toHaveBeenCalled();
    expect(emailService.sendEmailVerificationOtp).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('existing registration database failure remains unchanged', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    mockValidProof();
    const dbError = new Error('db failed');
    prisma.$transaction.mockRejectedValue(dbError);

    await expect(service.register(registerDto)).rejects.toBe(dbError);

    expect(emailService.sendRegistrationWelcome).not.toHaveBeenCalled();
  });

  describe('sendRegisterEmailOtp', () => {
    it('existing email returns 409 and does not send or create a challenge', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.sendRegisterEmailOtp({ email: 'NewPatient@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.emailRegistrationChallenge.upsert).not.toHaveBeenCalled();
      expect(
        prisma.emailRegistrationChallenge.findUnique,
      ).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationOtp).not.toHaveBeenCalled();
    });

    it('valid new email hashes OTP, stores a challenge, and sends via EmailService', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(null);

      const result = await service.sendRegisterEmailOtp({
        email: 'NewPatient@example.com',
        firstName: 'New',
      });

      expect(result.message).toBe('Verification code sent successfully');
      expect(prisma.emailRegistrationChallenge.upsert).toHaveBeenCalledTimes(1);
      const upsert = prisma.emailRegistrationChallenge.upsert.mock.calls[0][0];
      expect(upsert.where.email).toBe('newpatient@example.com');
      expect(upsert.create.email).toBe('newpatient@example.com');
      expect(upsert.create.otpHash).toMatch(/^\$2[aby]\$/);
      expect(upsert.create.otpHash).not.toHaveLength(6);
      expect(emailService.sendEmailVerificationOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'newpatient@example.com',
          userName: 'New',
          expiresInMinutes: 10,
        }),
      );
      const sentOtp = emailService.sendEmailVerificationOtp.mock.calls[0][0]
        .otp as string;
      const storedHash = upsert.create.otpHash as string;
      expect(sentOtp).toMatch(/^\d{6}$/);
      expect(await bcrypt.compare(sentOtp, storedHash)).toBe(true);
    });

    it('Resend failure returns failure', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(null);
      emailService.sendEmailVerificationOtp.mockRejectedValue(
        new Error('Resend down'),
      );

      await expect(
        service.sendRegisterEmailOtp({ email: 'newpatient@example.com' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('enforces resend cooldown', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue({
        ...verifiedChallenge,
        verifiedAt: null,
        lastSentAt: new Date(),
      });

      const error = await service
        .sendRegisterEmailOtp({ email: 'newpatient@example.com' })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect(prisma.emailRegistrationChallenge.upsert).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationOtp).not.toHaveBeenCalled();
    });

    it('latest OTP replaces previous OTP after cooldown', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue({
        ...verifiedChallenge,
        verifiedAt: new Date(),
        lastSentAt: new Date(Date.now() - 61_000),
      });

      await service.sendRegisterEmailOtp({ email: 'newpatient@example.com' });

      const update =
        prisma.emailRegistrationChallenge.upsert.mock.calls[0][0].update;
      expect(update.attemptCount).toBe(0);
      expect(update.verifiedAt).toBeNull();
      expect(update.otpHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyRegisterEmailOtp', () => {
    async function challengeWithOtp(
      otp: string,
      overrides: Record<string, unknown> = {},
    ) {
      const otpHash = await bcrypt.hash(otp, 12);
      return {
        id: 'chal_1',
        email: 'newpatient@example.com',
        otpHash,
        expiresAt: new Date(Date.now() + 60_000),
        attemptCount: 0,
        verifiedAt: null,
        consumedAt: null,
        lastSentAt: new Date(),
        ...overrides,
      };
    }

    it('correct OTP marks verified and returns a purpose-bound proof', async () => {
      const challenge = await challengeWithOtp('123456');
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(challenge);
      jwtService.signAsync.mockResolvedValue('email-proof');

      const result = await service.verifyRegisterEmailOtp({
        email: 'newpatient@example.com',
        otp: '123456',
      });

      expect(result).toEqual({ emailVerificationToken: 'email-proof' });
      expect(result).not.toHaveProperty('emailVerified');
      expect(prisma.emailRegistrationChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'chal_1' },
          data: { verifiedAt: expect.any(Date) },
        }),
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { purpose: 'register_email', email: 'newpatient@example.com' },
        expect.objectContaining({ jwtid: 'chal_1', expiresIn: '20m' }),
      );
    });

    it('incorrect OTP is rejected and increments attempts', async () => {
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
        await challengeWithOtp('123456'),
      );

      await expect(
        service.verifyRegisterEmailOtp({
          email: 'newpatient@example.com',
          otp: '000000',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.emailRegistrationChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { attemptCount: 1 },
        }),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('expired OTP is rejected', async () => {
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
        await challengeWithOtp('123456', {
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(
        service.verifyRegisterEmailOtp({
          email: 'newpatient@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow('OTP has expired');
    });

    it('max attempts are enforced', async () => {
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
        await challengeWithOtp('123456', { attemptCount: 5 }),
      );

      await expect(
        service.verifyRegisterEmailOtp({
          email: 'newpatient@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow('Too many incorrect attempts');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('reused OTP after successful verification is rejected', async () => {
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
        await challengeWithOtp('123456', { verifiedAt: new Date() }),
      );

      await expect(
        service.verifyRegisterEmailOtp({
          email: 'newpatient@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow('OTP has already been used');
    });

    it('old OTP fails after a new OTP is stored', async () => {
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue(
        await challengeWithOtp('654321'),
      );

      await expect(
        service.verifyRegisterEmailOtp({
          email: 'newpatient@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow('Invalid OTP');
    });
  });

  describe('register email verification gating', () => {
    it('missing proof is rejected without creating a user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.register({ ...registerDto, emailVerificationToken: '' }),
      ).rejects.toThrow('Email verification is required');
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(emailService.sendRegistrationWelcome).not.toHaveBeenCalled();
    });

    it('invalid proof is rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email verification is invalid or has expired',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('proof for a different email is rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jwtService.verifyAsync.mockResolvedValue({
        purpose: 'register_email',
        email: 'other@example.com',
        jti: 'chal_1',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email verification is invalid or has expired',
      );
    });

    it('unverified challenge is rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jwtService.verifyAsync.mockResolvedValue({
        purpose: 'register_email',
        email: 'newpatient@example.com',
        jti: 'chal_1',
      });
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue({
        ...verifiedChallenge,
        verifiedAt: null,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email verification is invalid or has expired',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('consumed challenge is rejected', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      jwtService.verifyAsync.mockResolvedValue({
        purpose: 'register_email',
        email: 'newpatient@example.com',
        jti: 'chal_1',
      });
      prisma.emailRegistrationChallenge.findUnique.mockResolvedValue({
        ...verifiedChallenge,
        consumedAt: new Date(),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email verification is invalid or has expired',
      );
    });

    it('second registration with the same proof fails consume', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockValidProof();
      mockSuccessfulRegisterTransaction(0);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email verification is no longer valid',
      );
      expect(emailService.sendRegistrationWelcome).not.toHaveBeenCalled();
    });
  });

  describe('phone OTP regression', () => {
    it('sendOtp still creates a synthetic user and does not send email OTP', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'otp_user' });

      const result = await service.sendOtp('+919999999999');

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(emailService.sendEmailVerificationOtp).not.toHaveBeenCalled();
      expect(prisma.emailRegistrationChallenge.upsert).not.toHaveBeenCalled();
    });
  });
});
