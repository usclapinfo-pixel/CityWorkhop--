import { CommunicationService } from './communication.service';

describe('CommunicationService', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  it('fails safely in production when no real provider is configured', async () => {
    process.env.NODE_ENV = 'production';

    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const otpService = { verifyOTP: jest.fn() };
    const providerResolverService = { resolveProvider: jest.fn(async () => null) };
    const providerRegistryService = { getProvider: jest.fn() };

    const service = new CommunicationService(
      otpService as any,
      providerResolverService as any,
      providerRegistryService as any,
      auditService as any,
    );

    await expect(service.sendOTP('9876543210', {
      channel: 'sms',
      otpToken: 'otp-token-1',
      otpCode: '123456',
    })).rejects.toThrow('No active OTP provider configured for production OTP delivery.');

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'communication.provider_missing',
      status: 'failure',
      metadata: expect.objectContaining({ deliveryMode: 'production_no_provider' }),
    }));
  });

  it('allows dev/mock behavior only in development and clearly marks it as mock', async () => {
    process.env.NODE_ENV = 'development';

    const auditService = { log: jest.fn(async () => ({ id: 'audit-2' })) };
    const otpService = { verifyOTP: jest.fn() };
    const providerResolverService = { resolveProvider: jest.fn(async () => null) };
    const providerRegistryService = { getProvider: jest.fn() };

    const service = new CommunicationService(
      otpService as any,
      providerResolverService as any,
      providerRegistryService as any,
      auditService as any,
    );

    await expect(service.sendOTP('9876543210', {
      channel: 'sms',
      otpToken: 'otp-token-dev',
      otpCode: '123456',
    })).resolves.toEqual({ otpToken: 'otp-token-dev', expiresIn: 0 });

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'communication.provider_missing',
      status: 'warning',
      metadata: expect.objectContaining({ deliveryMode: 'dev_mock', mockAllowed: true }),
    }));
  });

  it('does not generate a second OTP inside CommunicationService', async () => {
    process.env.NODE_ENV = 'development';

    const auditService = { log: jest.fn(async () => ({ id: 'audit-3' })) };
    const otpService = { generateOTP: jest.fn(), verifyOTP: jest.fn() };
    const providerResolverService = { resolveProvider: jest.fn(async () => null) };
    const providerRegistryService = { getProvider: jest.fn() };

    const service = new CommunicationService(
      otpService as any,
      providerResolverService as any,
      providerRegistryService as any,
      auditService as any,
    );

    await service.sendOTP('9876543210', { channel: 'sms', otpToken: 'otp-token-3', otpCode: '123456' });

    expect(otpService.generateOTP).not.toHaveBeenCalled();
  });
});
