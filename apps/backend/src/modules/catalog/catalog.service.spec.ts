import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { UserRole } from '@modules/users/enums/user-role.enum';

describe('CatalogService', () => {
  const appliance = { id: 'appliance-1', name: 'AC', code: 'AC', isActive: true, displayOrder: 0 };
  const category = { id: 'category-1', name: 'Repair', code: 'REPAIR', isActive: true, displayOrder: 0 };
  const offering = { id: 'service-1', applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'AC Repair', code: 'AC_REPAIR', isActive: true, displayOrder: 0 };
  const mapping = { id: 'mapping-1', cityId: 'city-1', serviceOfferingId: 'service-1', isActive: true, displayOrder: 0, serviceOffering: offering };

  function createService(overrides: any = {}) {
    const makeRepository = (findOneValue: any) => ({
      find: jest.fn(async () => [findOneValue]),
      findOne: jest.fn(async () => findOneValue),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: value.id ?? 'new-1', ...value })),
      createQueryBuilder: jest.fn(() => ({
        innerJoinAndSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), addOrderBy: jest.fn().mockReturnThis(), getMany: jest.fn(async () => [mapping]),
      })),
    });
    const applianceRepository = overrides.applianceRepository ?? makeRepository(appliance);
    const categoryRepository = overrides.categoryRepository ?? makeRepository(category);
    const serviceRepository = overrides.serviceRepository ?? makeRepository(offering);
    const mappingRepository = overrides.mappingRepository ?? makeRepository(mapping);
    const cityService = overrides.cityService ?? { validateActiveCityForActor: jest.fn(async () => ({ id: 'city-1', isActive: true })) };
    const auditService = overrides.auditService ?? { log: jest.fn(async () => ({ id: 'audit-1' })) };
    return {
      service: new CatalogService(applianceRepository as any, categoryRepository as any, serviceRepository as any, mappingRepository as any, cityService as any, auditService as any),
      applianceRepository, categoryRepository, serviceRepository, mappingRepository, cityService, auditService,
    };
  }

  it('creates appliance/category/service and audits catalogue actions', async () => {
    const { service, auditService } = createService();
    const actor = { sub: 'super-1', role: UserRole.SUPER_ADMIN };
    await service.createAppliance(actor, { name: 'AC', code: 'AC' });
    await service.createCategory(actor, { name: 'Repair', code: 'REPAIR' });
    await service.createService(actor, { applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'AC Repair', code: 'AC_REPAIR' });
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'catalog.appliance_created' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'catalog.category_created' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'catalog.service_created' }));
  });

  it('rejects duplicate catalogue codes', async () => {
    const applianceRepository = createService().applianceRepository;
    applianceRepository.save.mockRejectedValue({ code: '23505' });
    const { service } = createService({ applianceRepository });
    await expect(service.createAppliance({ role: UserRole.SUPER_ADMIN }, { name: 'AC', code: 'AC' })).rejects.toThrow(ConflictException);
  });

  it('rejects inactive appliance/category parents', async () => {
    const inactiveApplianceRepository = {
      findOne: jest.fn(async (options: any) => options?.where?.isActive === true ? null : ({ ...appliance, isActive: false })),
    };
    const { service } = createService({ applianceRepository: inactiveApplianceRepository });
    await expect(service.createService({ role: UserRole.SUPER_ADMIN }, { applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'AC Repair', code: 'AC_REPAIR' })).rejects.toThrow(ForbiddenException);
  });

  it('creates a valid City mapping and validates active City/service', async () => {
    const { service, cityService, auditService } = createService();
    await service.createMapping({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, { cityId: 'city-1', serviceOfferingId: 'service-1' });
    expect(cityService.validateActiveCityForActor).toHaveBeenCalledWith({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, 'city-1');
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'catalog.city_service_created' }));
  });

  it('rejects inactive or nonexistent City mappings', async () => {
    const cityService = { validateActiveCityForActor: jest.fn(async () => { throw new ForbiddenException('City is inactive'); }) };
    const { service } = createService({ cityService });
    await expect(service.createMapping({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, { cityId: 'city-1', serviceOfferingId: 'service-1' })).rejects.toThrow(ForbiddenException);
  });

  it('rejects catalogue mutation by non-Super Admin roles', async () => {
    const { service } = createService();
    await expect(service.createAppliance({ role: UserRole.ADMIN }, { name: 'AC', code: 'AC' })).rejects.toThrow(ForbiddenException);
    await expect(service.createCategory({ role: UserRole.CITY_ADMIN }, { name: 'Repair', code: 'REPAIR' })).rejects.toThrow(ForbiddenException);
    await expect(service.createService({ role: UserRole.CUSTOMER }, { applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'Repair', code: 'REPAIR' })).rejects.toThrow(ForbiddenException);
  });

  it('returns only active appliances and matching active services for a City', async () => {
    const { service } = createService();
    const appliances = await service.listActiveAppliances();
    const services = await service.listServicesForAppliance('appliance-1', 'city-1');
    expect(appliances).toEqual([appliance]);
    expect(services).toEqual([offering]);
  });

  it('rejects an invalid appliance read', async () => {
    const applianceRepository = createService().applianceRepository;
    applianceRepository.findOne.mockResolvedValue(null);
    const { service } = createService({ applianceRepository });
    await expect(service.listServicesForAppliance('missing', 'city-1')).rejects.toThrow(NotFoundException);
  });
});
