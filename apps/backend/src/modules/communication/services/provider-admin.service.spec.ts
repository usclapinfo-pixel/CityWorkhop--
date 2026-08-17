import { ForbiddenException } from '@nestjs/common';
import { ProviderAdminService } from './provider-admin.service';
import { UserRole } from '@modules/users/enums/user-role.enum';

describe('ProviderAdminService City validation', () => {
  const provider = {
    id: 'provider-1',
    cityId: 'city-1',
    providerType: 'MSG91',
    channel: 'sms',
    isActive: false,
    credentials: { apiKey: 'stored-hash' },
  };

  const createService = (cityError?: Error) => {
    const providerConfigService = {
      getProviderConfig: jest.fn(async () => ({ ...provider })),
      updateProviderConfig: jest.fn(async (_id: string, input: any) => ({ ...provider, ...input })),
    };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const secretStorage = { storeCredentials: jest.fn((value) => value), maskCredentials: jest.fn((value) => value) };
    const cityService = {
      validateActiveCityForActor: jest.fn(async () => {
        if (cityError) throw cityError;
        return { id: 'city-1', isActive: true };
      }),
    };
    const service = new ProviderAdminService(
      providerConfigService as any,
      auditService as any,
      secretStorage as any,
      cityService as any,
    );
    return { service, providerConfigService, cityService };
  };

  it('enables a provider attached to an active city', async () => {
    const { service, cityService, providerConfigService } = createService();
    await service.enableProvider('provider-1', 'admin-1', UserRole.ADMIN);
    expect(cityService.validateActiveCityForActor).toHaveBeenCalledWith(
      { sub: 'admin-1', role: UserRole.ADMIN },
      'city-1',
    );
    expect(providerConfigService.updateProviderConfig).toHaveBeenCalled();
  });

  it('rejects enabling a provider attached to an inactive city', async () => {
    const { service, providerConfigService } = createService(new ForbiddenException('City is inactive'));
    await expect(service.enableProvider('provider-1', 'admin-1', UserRole.ADMIN)).rejects.toThrow(ForbiddenException);
    expect(providerConfigService.updateProviderConfig).not.toHaveBeenCalled();
  });

  it('validates the existing city when updating without cityId', async () => {
    const { service, cityService } = createService();
    await service.updateProvider('provider-1', { description: 'updated' }, 'admin-1', UserRole.ADMIN);
    expect(cityService.validateActiveCityForActor).toHaveBeenCalledWith(
      { sub: 'admin-1', role: UserRole.ADMIN },
      'city-1',
    );
  });

  it('rejects updating a provider whose existing city is inactive', async () => {
    const { service, providerConfigService } = createService(new ForbiddenException('City is inactive'));
    await expect(service.updateProvider('provider-1', { description: 'updated' }, 'admin-1', UserRole.ADMIN)).rejects.toThrow(ForbiddenException);
    expect(providerConfigService.updateProviderConfig).not.toHaveBeenCalled();
  });

  it('validates a replacement active city during update', async () => {
    const { service, cityService } = createService();
    await service.updateProvider('provider-1', { cityId: 'city-2' }, 'admin-1', UserRole.ADMIN);
    expect(cityService.validateActiveCityForActor).toHaveBeenCalledWith(
      { sub: 'admin-1', role: UserRole.ADMIN },
      'city-2',
    );
  });

  it('rejects a replacement inactive city during update', async () => {
    const { service, providerConfigService } = createService(new ForbiddenException('City is inactive'));
    await expect(service.updateProvider('provider-1', { cityId: 'city-2' }, 'admin-1', UserRole.ADMIN)).rejects.toThrow(ForbiddenException);
    expect(providerConfigService.updateProviderConfig).not.toHaveBeenCalled();
  });
});
