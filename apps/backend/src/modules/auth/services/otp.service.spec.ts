import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OTPService } from './otp.service';

describe('OTPService', () => {
  const createService = (overrides?: Partial<any>) => {
    const repo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 'otp-1' })),
      findOne: jest.fn(),
      update: jest.fn(async () => ({ affected: 1 })),
      delete: jest.fn(async () => ({ affected: 1 })),
    };

    const idempotencyService = {
      checkOTPFloodProtection: jest.fn(async () => ({ allowed: true, secondsUntilNextAttempt: 0 })),
    };

    const auditService = {
      log: jest.fn(async () => ({ id: 'audit-1' })),
    };

    const service = new OTPService(
      repo as any,
      idempotencyService as any,
      auditService as any,
    );

    return { service, repo, idempotencyService, auditService, ...overrides };
  };

  it('generates OTP once and stores only the bcrypt hash', async () => {
    const { service, repo } = createService();

    const result = await service.generateOTP('9876543210', null, { channel: 'sms', expiresInMinutes: 10 });

    expect(result.otpToken).toBeTruthy();
    expect(result.otpCode).toMatch(/^\d{6}$/);
    expect(repo.create).toHaveBeenCalledTimes(1);

    const createdOtp = repo.create.mock.calls[0][0];
    expect(createdOtp.otpHash).toBeTruthy();
    expect(createdOtp.otpHash).not.toEqual(result.otpCode);
    expect(createdOtp.otpHash.startsWith('$2')).toBe(true);
    expect(createdOtp.otpToken).toBe(result.otpToken);

    const matchesHash = await bcrypt.compare(result.otpCode, createdOtp.otpHash);
    expect(matchesHash).toBe(true);
  });

  it('uses a secure generation path instead of Math.random', async () => {
    const { service } = createService();
    const randomSpy = jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not generate OTPs');
    });

    await expect(service.generateOTP('9876543220', null)).resolves.toEqual(expect.objectContaining({
      otpToken: expect.any(String),
      expiresIn: expect.any(Number),
      otpCode: expect.stringMatching(/^\d{6}$/),
    }));

    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it('creates OTP record and token reference', async () => {
    const { service, repo } = createService();

    const result = await service.generateOTP('9876543211', null, { channel: 'whatsapp' });
    const createdOtp = repo.create.mock.calls[0][0];

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(createdOtp.otpToken).toEqual(result.otpToken);
    expect(createdOtp.status).toBe('pending');
    expect(createdOtp.expiresAt).toBeInstanceOf(Date);
    expect(createdOtp.channel).toBe('whatsapp');
  });

  it('verifies a correct OTP successfully', async () => {
    const { service, repo } = createService();
    const otpCode = '123456';
    repo.findOne.mockResolvedValue({
      id: 'otp-1',
      otpHash: await bcrypt.hash(otpCode, 10),
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543212',
      email: null,
    });

    const result = await service.verifyOTP('otp-token-1', otpCode, '127.0.0.1');

    expect(result.success).toBe(true);
    expect(repo.update).toHaveBeenCalledWith({ id: 'otp-1', status: 'pending' }, expect.objectContaining({
      status: 'verified',
      verifiedAt: expect.any(Date),
    }));
  });

  it('rejects an invalid OTP', async () => {
    const { service, repo } = createService();
    repo.findOne.mockResolvedValue({
      id: 'otp-2',
      otpHash: await bcrypt.hash('654321', 10),
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543213',
      email: null,
    });

    await expect(service.verifyOTP('otp-token-2', '111111', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
    expect(repo.update).toHaveBeenCalledWith('otp-2', { attempts: 1 });
  });

  it('rejects an expired OTP', async () => {
    const { service, repo } = createService();
    repo.findOne.mockResolvedValue({
      id: 'otp-3',
      otpHash: await bcrypt.hash('111111', 10),
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(Date.now() - 60 * 1000),
      phoneNumber: '9876543214',
      email: null,
    });

    await expect(service.verifyOTP('otp-token-3', '111111', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
    expect(repo.update).toHaveBeenCalledWith('otp-3', { status: 'expired' });
  });

  it('rejects an already verified OTP', async () => {
    const { service, repo } = createService();
    repo.findOne.mockResolvedValue({
      id: 'otp-4',
      otpHash: await bcrypt.hash('222222', 10),
      status: 'verified',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543215',
      email: null,
    });

    await expect(service.verifyOTP('otp-token-4', '222222', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('enforces rate limiting before generation', async () => {
    const { service, idempotencyService } = createService();
    idempotencyService.checkOTPFloodProtection.mockResolvedValue({ allowed: false, secondsUntilNextAttempt: 30 });

    await expect(service.generateOTP('9876543216', null)).rejects.toThrow(BadRequestException);
  });

  it('does not allow OTP reuse after successful verification', async () => {
    const { service, repo } = createService();
    repo.findOne.mockResolvedValue({
      id: 'otp-5',
      otpHash: await bcrypt.hash('333333', 10),
      status: 'verified',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543217',
      email: null,
    });

    await expect(service.verifyOTP('otp-token-5', '333333', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a concurrent verification that loses the atomic pending claim', async () => {
    const { service, repo } = createService();
    const otpCode = '444444';
    let verificationClaims = 0;
    repo.findOne.mockResolvedValue({
      id: 'otp-6',
      otpHash: await bcrypt.hash(otpCode, 10),
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543218',
      email: null,
    });
    repo.update.mockImplementation(async (...args: any[]) => {
      const criteria = args[0];
      if (criteria?.status === 'pending') {
        verificationClaims += 1;
        return { affected: verificationClaims === 1 ? 1 : 0 };
      }
      return { affected: 1 };
    });

    const results = await Promise.allSettled([
      service.verifyOTP('otp-token-6', otpCode),
      service.verifyOTP('otp-token-6', otpCode),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });

  it('invalidates only pending OTPs for the same identity and channel on resend', async () => {
    const { service, repo } = createService();

    await service.generateOTP('9876543219', null, { channel: 'whatsapp', purpose: 'REGISTRATION' });

    expect(repo.update).toHaveBeenCalledWith(
      { phoneNumber: '9876543219', channel: 'whatsapp', purpose: 'REGISTRATION', status: 'pending' },
      { status: 'failed' },
    );
  });

  it('keeps registration and login OTPs isolated by purpose', async () => {
    const { service, repo } = createService();

    await service.generateOTP('9876543230', null, {
      channel: 'whatsapp',
      purpose: 'REGISTRATION',
    });

    expect(repo.update).toHaveBeenCalledWith(
      {
        phoneNumber: '9876543230',
        channel: 'whatsapp',
        purpose: 'REGISTRATION',
        status: 'pending',
      },
      { status: 'failed' },
    );

    repo.update.mockClear();

    await service.generateOTP('9876543230', null, {
      channel: 'whatsapp',
      purpose: 'LOGIN',
    });

    expect(repo.update).toHaveBeenCalledWith(
      {
        phoneNumber: '9876543230',
        channel: 'whatsapp',
        purpose: 'LOGIN',
        status: 'pending',
      },
      { status: 'failed' },
    );
  });
  it('allows the newly generated OTP to verify successfully', async () => {
    const { service, repo } = createService();
    const generated = await service.generateOTP('9876543221', null, { channel: 'sms' });
    repo.findOne.mockResolvedValue({
      id: 'otp-7',
      otpHash: await bcrypt.hash(generated.otpCode, 10),
      status: 'pending',
      attempts: 0,
      expiresAt: new Date(Date.now() + 60 * 1000),
      phoneNumber: '9876543221',
      email: null,
    });

    await expect(service.verifyOTP(generated.otpToken, generated.otpCode)).resolves.toEqual({ success: true });
  });

  it('uses the TypeORM LessThan operator for cleanup', async () => {
    const { service, repo } = createService();

    await expect(service.cleanupExpiredOTPs()).resolves.toBe(1);

    const criteria = (repo.delete as any).mock.calls[0][0];
    expect(criteria.expiresAt).toEqual(expect.objectContaining({
      _type: 'lessThan',
      _value: expect.any(Date),
    }));
  });
});
