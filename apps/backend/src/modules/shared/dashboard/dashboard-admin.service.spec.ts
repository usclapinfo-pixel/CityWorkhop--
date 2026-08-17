import { UserRole } from '@modules/users/enums/user-role.enum';
import { DashboardAdminService } from './dashboard-admin.service';

function aggregateBuilder(raw: any) {
  const builder: any = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(async () => raw),
    getMany: jest.fn(async () => [{ id: 'user-1' }]),
    getRawMany: jest.fn(async () => []),
  };
  return builder;
}

describe('DashboardAdminService', () => {
  const userCounts = {
    total: '12', pending: '3', approved: '1', active: '7', suspended: '1', rejected: '0', deactivated: '0',
    customers: '5', technicians: '2', vendors: '1', riders: '1', activeTechnicians: '2', activeVendors: '1', activeRiders: '1', franchiseOwners: '1', cityAdmins: '1',
  };
  const kycCounts = { pending: '2', underReview: '1', verified: '3', rejected: '0', correctionRequired: '1' };

  function createService(actor: any) {
    const userBuilder = aggregateBuilder(userCounts);
    const scopeBuilder = aggregateBuilder(null);
    const kycBuilder = aggregateBuilder(kycCounts);
    const userRepository = {
      find: jest.fn(async () => [{ id: 'user-1' }]),
      createQueryBuilder: jest.fn((alias: string) => alias === 'user' ? (actor.role === UserRole.SUPER_ADMIN ? userBuilder : scopeBuilder) : userBuilder),
    };
    const kycRepository = { createQueryBuilder: jest.fn(() => kycBuilder) };
    const userManagementService = { getScopedUserIds: jest.fn(async () => ['user-1']) };
    const auditAdminService = { list: jest.fn(async () => ({ data: [{ id: 'audit-1', eventType: 'user.approved' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } })) };
    const cityRepository = { createQueryBuilder: jest.fn(() => aggregateBuilder([])) };
    const service = new DashboardAdminService(userRepository as any, kycRepository as any, cityRepository as any, userManagementService as any, auditAdminService as any);
    return { service, userRepository, kycRepository, userManagementService, auditAdminService };
  }

  it('returns real aggregate counts and recent activity for Super Admin', async () => {
    const actor = { sub: 'super-1', role: UserRole.SUPER_ADMIN };
    const { service, auditAdminService } = createService(actor);
    const result = await service.getSummary(actor);

    expect(result.users).toEqual({ total: 12, pending: 3, approved: 1, active: 7, suspended: 1, rejected: 0, deactivated: 0 });
    expect(result.roles).toEqual({ customers: 5, technicians: 2, vendors: 1, riders: 1, activeTechnicians: 2, activeVendors: 1, activeRiders: 1, franchiseOwners: 1, cityAdmins: 1 });
    expect(result.kyc).toEqual({ pending: 2, underReview: 1, verified: 3, rejected: 0, correctionRequired: 1 });
    expect(result.recentActivity).toEqual([{ id: 'audit-1', eventType: 'user.approved' }]);
    expect(result.cities).toEqual([]);
    expect(result.cityOverviewAvailable).toBe(true);
    expect(auditAdminService.list).toHaveBeenCalledWith(actor, { page: 1, limit: 10 });
  });

  it('uses the existing scope service for Admin and City Admin', async () => {
    const actor = { sub: 'admin-1', role: UserRole.ADMIN, city_ids: ['city-1'] };
    const { service, userManagementService } = createService(actor);
    await service.getSummary(actor);
    expect(userManagementService.getScopedUserIds).toHaveBeenCalledWith(actor);
  });

  it('returns zero counts for an empty authorized scope', async () => {
    const actor = { sub: 'city-admin-1', role: UserRole.CITY_ADMIN, city_ids: [] };
    const { service, userManagementService, auditAdminService } = createService(actor);
    userManagementService.getScopedUserIds.mockResolvedValue([]);
    auditAdminService.list.mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    const result = await service.getSummary(actor);
    expect(result.users.total).toBe(0);
    expect(result.kyc.pending).toBe(0);
    expect(result.recentActivity).toEqual([]);
  });
});
