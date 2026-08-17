import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { AccountStatus } from '@modules/users/enums/account-status.enum';

describe('AuthService Phase 3 registration rules', () => {
  const createService = () => {
    const userRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'user-1', createdAt: new Date(), ...value })),
      update: jest.fn(),
    };
    const jwtService = { sign: jest.fn(() => 'token') };
    const configService = { get: jest.fn(() => 'http://localhost:3000') };
    const otpService = {
      getOTPRecord: jest.fn(async () => ({ phoneNumber: 'fake-phone' })),
      verifyOTP: jest.fn(async () => ({ success: true })),
    };
    const magicLinkService = { verifyMagicLink: jest.fn() };
    const communicationService = { sendOTP: jest.fn(), sendMagicLink: jest.fn() };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const rateLimitService = { isLimited: jest.fn(async () => false) };

    const service = new AuthService(
      userRepository as any,
      jwtService as any,
      configService as any,
      otpService as any,
      magicLinkService as any,
      communicationService as any,
      auditService as any,
      rateLimitService as any,
    );

    return { service, userRepository, auditService };
  };

  it.each([
    UserRole.TECHNICIAN,
    UserRole.VENDOR,
    UserRole.RIDER,
    UserRole.FRANCHISE_OWNER,
  ])('registers %s as PENDING', async (role) => {
    const { service, userRepository } = createService();

    const result = await service.verifyOTPAndCompleteRegistration(
      'otp-token',
      '123456',
      'First',
      'Last',
      `fake-${role}@example.test`,
      role,
    );

    expect(result.user.status).toBe(AccountStatus.PENDING);
    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      role,
      status: AccountStatus.PENDING,
      isDemoAccount: false,
    }));
  });

  it('preserves customer registration', async () => {
    const { service } = createService();

    const result = await service.verifyOTPAndCompleteRegistration(
      'otp-token',
      '123456',
      'First',
      'Last',
      'customer@example.test',
      UserRole.CUSTOMER,
    );

    expect(result.user.role).toBe(UserRole.CUSTOMER);
    expect(result.user.status).toBe(AccountStatus.PENDING);
  });

  it.each([UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN])(
    'rejects public %s registration', async (role) => {
      const { service } = createService();

      await expect(service.verifyOTPAndCompleteRegistration(
        'otp-token',
        '123456',
        'First',
        'Last',
        `privileged-${role}@example.test`,
        role,
      )).rejects.toThrow(BadRequestException);
    },
  );

  it.each([UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN])(
    'rejects public demo %s registration', async (role) => {
      const { service } = createService();
      await expect(service.registerDemoAccount(role)).rejects.toThrow(BadRequestException);
    },
  );
});
