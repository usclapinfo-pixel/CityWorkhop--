import { ConflictException, ForbiddenException } from '@nestjs/common';
import { CityService } from './city.service';
import { UserRole } from '@modules/users/enums/user-role.enum';

describe('CityService', () => {
  const city = { id: 'city-1', name: 'Bareilly', state: 'UP', district: 'Bareilly', code: 'BRL', isActive: true };
  const createService = () => {
    const cityRepository = {
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), getManyAndCount: jest.fn(async () => [[city], 1]), getRawMany: jest.fn(async () => [city]),
      })),
      findOne: jest.fn(async (options: any) => options?.where?.id === 'missing-city' ? null : city),
      find: jest.fn(async () => [city]),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn(async (value) => ({ id: 'city-1', ...value })),
    };
    const userRepository = { findOne: jest.fn(async () => ({ authorizedCityIds: ['city-1'] })) };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    return { service: new CityService(cityRepository as any, userRepository as any, auditService as any), cityRepository, auditService };
  };

  it('allows Super Admin to create, update, activate and deactivate cities', async () => {
    const { service, cityRepository, auditService } = createService();
    const actor = { sub: 'super-1', role: UserRole.SUPER_ADMIN };
    await service.createCity(actor, { name: 'Bareilly', state: 'UP', district: 'Bareilly', code: 'BRL' });
    await service.updateCity(actor, 'city-1', { name: 'New Bareilly' });
    await service.activateCity(actor, 'city-1');
    await service.deactivateCity(actor, 'city-1');
    expect(cityRepository.save).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'city.created' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'city.updated' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'city.activated' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'city.deactivated' }));
  });

  it('rejects non-Super Admin city mutation and out-of-scope access', async () => {
    const { service } = createService();
    await expect(service.createCity({ role: UserRole.ADMIN }, { name: 'X', state: 'Y', district: 'Z', code: 'XYZ' })).rejects.toThrow(ForbiddenException);
    await expect(service.getCity({ role: UserRole.CITY_ADMIN, city_ids: ['city-2'] }, 'city-1')).rejects.toThrow('City not found');
  });

  it('allows Super Admin and scoped admins to access authorized cities', async () => {
    const { service } = createService();
    await expect(service.getCity({ role: UserRole.SUPER_ADMIN }, 'city-1')).resolves.toEqual(city);
    await expect(service.getCity({ role: UserRole.ADMIN, city_ids: ['city-1'] }, 'city-1')).resolves.toEqual(city);
    await expect(service.getCity({ role: UserRole.CITY_ADMIN, city_ids: ['city-1'] }, 'city-1')).resolves.toEqual(city);
  });

  it('normalizes out-of-scope and nonexistent City IDs for scoped admins', async () => {
    const { service } = createService();
    const actor = { role: UserRole.ADMIN, city_ids: ['city-2'] };
    const outOfScope = service.getCity(actor, 'city-1');
    const nonexistent = service.getCity(actor, 'missing-city');
    await expect(outOfScope).rejects.toThrow('City not found');
    await expect(nonexistent).rejects.toThrow('City not found');
    await expect(outOfScope).rejects.toBeInstanceOf((await nonexistent.catch((error) => error)).constructor);
  });

  it('rejects an unauthorized non-admin through the service boundary', async () => {
    const { service } = createService();
    await expect(service.getCity({ role: UserRole.CUSTOMER }, 'city-1')).rejects.toThrow(ForbiddenException);
  });

  it('rejects inactive cities for new assignments', async () => {
    const { service, cityRepository } = createService();
    cityRepository.findOne.mockResolvedValue({ ...city, isActive: false });
    await expect(service.validateActiveCityForActor({ role: UserRole.SUPER_ADMIN }, 'city-1')).rejects.toThrow(ForbiddenException);
  });

  it('maps duplicate city code to a conflict', async () => {
    const { service, cityRepository } = createService();
    cityRepository.save.mockRejectedValue({ code: '23505' });
    await expect(service.createCity({ sub: 'super-1', role: UserRole.SUPER_ADMIN }, { name: 'X', state: 'Y', district: 'Z', code: 'XYZ' })).rejects.toThrow(ConflictException);
  });
});
