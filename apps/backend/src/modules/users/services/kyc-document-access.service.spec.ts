import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { KycDocumentAccessService } from './kyc-document-access.service';
import { UserRole } from '../enums/user-role.enum';

describe('KycDocumentAccessService', () => {
  const actor = { sub: 'admin-1', role: UserRole.ADMIN };
  const record = {
    id: 'record-1',
    userId: 'user-1',
    documentType: 'PAN',
    storageReference: 'kyc/user-1/pan.pdf',
    documentMetadata: { mimeType: 'application/pdf' },
  };

  const createService = (overrides: any = {}) => {
    const kycRepository = {
      findOne: jest.fn(async () => record),
    };
    const userManagementService = {
      findScopedUser: jest.fn(async () => ({ id: 'user-1', authorizedCityIds: ['city-1'] })),
    };
    const storageService = {
      createSignedReadUrl: jest.fn(async () => ({
        accessUrl: 'https://signed.example/temporary',
        expiresIn: 300,
        contentType: 'application/pdf',
      })),
    };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const service = new KycDocumentAccessService(
      overrides.kycRepository ?? kycRepository,
      overrides.userManagementService ?? userManagementService,
      overrides.storageService ?? storageService,
      overrides.auditService ?? auditService,
    );
    return { service, kycRepository, userManagementService, storageService, auditService };
  };

  it('allows an authorized Admin and returns only temporary access data', async () => {
    const { service, storageService, auditService } = createService();

    const result = await service.createAccess(actor, 'user-1', 'record-1');

    expect(result).toEqual({
      accessUrl: 'https://signed.example/temporary',
      expiresIn: 300,
      contentType: 'application/pdf',
    });
    expect(result).not.toHaveProperty('storageReference');
    expect(result).not.toHaveProperty('serviceRoleKey');
    expect(storageService.createSignedReadUrl).toHaveBeenCalledWith('kyc/user-1/pan.pdf', 'application/pdf');
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'user.kyc_document_viewed',
      metadata: expect.objectContaining({ actorId: 'admin-1', kycRecordId: 'record-1', documentType: 'PAN' }),
    }));
  });

  it('allows Super Admin and authorized City Admin through the shared scope service', async () => {
    const { service, userManagementService } = createService();

    await service.createAccess({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, 'user-1', 'record-1');
    await service.createAccess({ sub: 'city-admin-1', role: UserRole.CITY_ADMIN }, 'user-1', 'record-1');

    expect(userManagementService.findScopedUser).toHaveBeenCalledTimes(2);
  });

  it('propagates a city-scope denial without touching storage', async () => {
    const scopeError = new ForbiddenException('User is outside your permitted city scope');
    const userManagementService = { findScopedUser: jest.fn(async () => { throw scopeError; }) };
    const { service, storageService } = createService({ userManagementService });

    await expect(service.createAccess(actor, 'user-1', 'record-1')).rejects.toThrow(ForbiddenException);
    expect(storageService.createSignedReadUrl).not.toHaveBeenCalled();
  });

  it('rejects a missing or mismatched KYC record', async () => {
    const kycRepository = { findOne: jest.fn(async () => null) };
    const { service } = createService({ kycRepository });

    await expect(service.createAccess(actor, 'user-1', 'record-2')).rejects.toThrow(NotFoundException);
  });

  it('does not audit or leak details when storage access fails', async () => {
    const storageService = { createSignedReadUrl: jest.fn(async () => { throw new NotFoundException('Document is unavailable'); }) };
    const { service, auditService } = createService({ storageService });

    await expect(service.createAccess(actor, 'user-1', 'record-1')).rejects.toThrow(NotFoundException);
    expect(auditService.log).not.toHaveBeenCalled();
  });
});
