import { ForbiddenException } from '@nestjs/common';
import { AuditAdminService } from './audit-admin.service';
import { UserRole } from '@modules/users/enums/user-role.enum';

function queryBuilder(records: any[] = []) {
  const builder: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(async () => records),
    getManyAndCount: jest.fn(async () => [records, records.length]),
  };
  return builder;
}

describe('AuditAdminService', () => {
  const audit = {
    id: 'audit-1',
    eventType: 'user.kyc_approved',
    action: 'update',
    entityType: 'User',
    entityId: 'user-1',
    userId: 'admin-1',
    userRole: 'ADMIN',
    status: 'success',
    metadata: {
      targetUserId: 'user-1',
      role: 'TECHNICIAN',
      signedUrl: 'https://secret.example',
      storageReference: 'private/path',
      otp: '123456',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns paginated sanitized logs for Super Admin', async () => {
    const builder = queryBuilder([audit]);
    const auditRepository = { createQueryBuilder: jest.fn(() => builder), findOne: jest.fn() };
    const userRepository = { createQueryBuilder: jest.fn() };
    const service = new AuditAdminService(auditRepository as any, userRepository as any);

    const result = await service.list({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, { page: 1, limit: 25 });

    expect(result.meta).toEqual({ page: 1, limit: 25, total: 1, totalPages: 1 });
    expect(result.data[0].metadata).toEqual({ targetUserId: 'user-1', role: 'TECHNICIAN' });
    expect(result.data[0].metadata.signedUrl).toBeUndefined();
    expect(result.data[0].metadata.storageReference).toBeUndefined();
    expect(result.data[0].metadata.otp).toBeUndefined();
    expect(builder.orderBy).toHaveBeenCalledWith('audit.createdAt', 'DESC');
  });

  it('applies action, actor, target, date, and search filters', async () => {
    const builder = queryBuilder();
    const auditRepository = { createQueryBuilder: jest.fn(() => builder), findOne: jest.fn() };
    const userRepository = { createQueryBuilder: jest.fn() };
    const service = new AuditAdminService(auditRepository as any, userRepository as any);

    await service.list({ role: UserRole.SUPER_ADMIN }, {
      page: 2,
      limit: 50,
      action: 'update',
      eventType: 'user.kyc_approved',
      actorId: 'admin-1',
      targetUserId: 'user-1',
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-16T23:59:59.000Z',
      search: 'kyc',
    });

    expect(builder.skip).toHaveBeenCalledWith(50);
    expect(builder.take).toHaveBeenCalledWith(50);
    expect(builder.andWhere).toHaveBeenCalled();
  });

  it('uses the existing city-scope user resolution for City Admin', async () => {
    const builder = queryBuilder();
    const scopeBuilder = queryBuilder([{ id: 'user-1' }]);
    const auditRepository = { createQueryBuilder: jest.fn(() => builder), findOne: jest.fn() };
    const userRepository = { createQueryBuilder: jest.fn(() => scopeBuilder) };
    const service = new AuditAdminService(auditRepository as any, userRepository as any);

    await service.list({ role: UserRole.CITY_ADMIN, city_ids: ['city-1'] }, { page: 1, limit: 25 });

    expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(builder.andWhere).toHaveBeenCalled();
  });

  it('rejects a city outside the actor scope', async () => {
    const auditRepository = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
    const userRepository = { createQueryBuilder: jest.fn() };
    const service = new AuditAdminService(auditRepository as any, userRepository as any);

    await expect(service.list({ role: UserRole.CITY_ADMIN, city_ids: ['city-1'] }, { cityId: 'city-2' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('rejects a detail record outside scope', async () => {
    const auditRepository = { createQueryBuilder: jest.fn(), findOne: jest.fn(async () => audit) };
    const userRepository = { createQueryBuilder: jest.fn(() => queryBuilder([])) };
    const service = new AuditAdminService(auditRepository as any, userRepository as any);

    await expect(service.get({ role: UserRole.CITY_ADMIN, city_ids: ['city-2'] }, 'audit-1'))
      .rejects.toThrow(ForbiddenException);
  });
});
