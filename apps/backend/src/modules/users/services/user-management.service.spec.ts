import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { AccountStatus } from '../enums/account-status.enum';
import { UserRole } from '../enums/user-role.enum';
import { KycVerificationStatus } from '../enums/kyc.enum';

describe('UserManagementService', () => {
  const target = (overrides: any = {}) => ({
    id: 'user-1',
    role: UserRole.TECHNICIAN,
    status: AccountStatus.KYC_SUBMITTED,
    isActive: true,
    kycVerified: false,
    authorizedCityIds: ['city-1'],
    defaultCityId: 'city-1',
    passwordHash: 'not-returned',
    ...overrides,
  });

  const createService = (user = target(), records: any[] = []) => {
    const userRepository = {
      find: jest.fn(async () => [user]),
      findOne: jest.fn(async () => user),
      update: jest.fn(async (_id, changes) => {
        Object.assign(user, changes);
        return { affected: 1 };
      }),
    };
    const kycRepository = {
      find: jest.fn(async () => records),
      update: jest.fn(async () => ({ affected: records.length })),
    };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const cityService = { validateActiveCityForActor: jest.fn() };
    const service = new UserManagementService(userRepository as any, kycRepository as any, auditService as any, cityService as any);
    return { service, userRepository, kycRepository, auditService };
  };

  it('allows an Admin to approve within its permitted city scope', async () => {
    const record = { id: 'kyc-1', userId: 'user-1', verificationStatus: 'PENDING' };
    const { service, userRepository, kycRepository, auditService } = createService(target(), [record]);

    await service.approve({ sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] }, 'user-1');

    expect(kycRepository.update).toHaveBeenCalledWith({ userId: 'user-1' }, expect.objectContaining({
      verificationStatus: KycVerificationStatus.VERIFIED,
      verifiedByUser: { id: 'admin-1' },
    }));
    expect(userRepository.update).toHaveBeenCalledWith('user-1', expect.objectContaining({
      status: AccountStatus.ACTIVE,
      kycVerified: true,
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.approved', userId: 'admin-1' }));
  });

  it('allows Super Admin approval without city scope', async () => {
    const { service, userRepository } = createService(target(), [{ id: 'kyc-1' }]);
    await service.approve({ sub: 'super-1', role: UserRole.SUPER_ADMIN, city_ids: [] }, 'user-1');
    expect(userRepository.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ status: AccountStatus.ACTIVE }));
  });

  it('blocks an unauthorized role from approval', async () => {
    const { service } = createService(target(), [{ id: 'kyc-1' }]);
    await expect(service.approve({ sub: 'tech-1', role: UserRole.TECHNICIAN, city_ids: ['city-1'] }, 'user-1'))
      .rejects.toThrow(ForbiddenException);
  });

  it('blocks an Admin outside the target city scope', async () => {
    const { service } = createService(target(), [{ id: 'kyc-1' }]);
    await expect(service.approve({ sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-2'] }, 'user-1'))
      .rejects.toThrow(ForbiddenException);
  });

  it('requires KYC for provider approval', async () => {
    const { service } = createService(target(), []);
    await expect(service.approve({ sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] }, 'user-1'))
      .rejects.toThrow(BadRequestException);
  });

  it('moves a submitted KYC record to UNDER_REVIEW', async () => {
    const { service, userRepository, kycRepository, auditService } = createService(target(), [{ id: 'kyc-1' }]);

    await service.startReview({ sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] }, 'user-1');

    expect(kycRepository.update).toHaveBeenCalledWith({ userId: 'user-1' }, {
      submissionStatus: 'UNDER_REVIEW',
    });
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { status: AccountStatus.UNDER_REVIEW });
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.kyc_under_review' }));
  });

  it('supports rejection, correction, suspension, and reactivation with audits', async () => {
    const { service, userRepository, kycRepository, auditService } = createService(target(), [{ id: 'kyc-1' }]);
    const actor = { sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] };

    await service.reject(actor, 'user-1', { reason: 'Document is unclear' });
    await service.requestCorrection(actor, 'user-1', { reason: 'Submit a clearer document' });
    await service.suspend(actor, 'user-1', { reason: 'Policy review' });
    await service.reactivate(actor, 'user-1');

    expect(kycRepository.update).toHaveBeenCalledWith({ userId: 'user-1' }, expect.objectContaining({
      verificationStatus: KycVerificationStatus.CORRECTION_REQUIRED,
    }));
    expect(userRepository.update).toHaveBeenCalledWith('user-1', expect.objectContaining({
      status: AccountStatus.PENDING,
      isActive: false,
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.rejected' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.kyc_correction_requested' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.suspended' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'user.reactivated' }));
  });

  it('does not expose passwordHash in user details', async () => {
    const { service } = createService();
    const result = await service.getUser({ sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] }, 'user-1');
    expect(result.passwordHash).toBeUndefined();
  });
});
