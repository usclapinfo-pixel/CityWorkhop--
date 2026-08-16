import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '@modules/shared/audit/audit.service';
import { CityService } from '@modules/cities/services/city.service';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { ApplianceType } from './entities/appliance-type.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceOffering } from './entities/service-offering.entity';
import { CityServiceOffering } from './entities/city-service-offering.entity';
import { CatalogListQueryDto, CreateApplianceTypeDto, CreateCityServiceOfferingDto, CreateServiceCategoryDto, CreateServiceOfferingDto, UpdateApplianceTypeDto, UpdateCityServiceOfferingDto, UpdateServiceCategoryDto, UpdateServiceOfferingDto } from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(ApplianceType) private readonly applianceRepository: Repository<ApplianceType>,
    @InjectRepository(ServiceCategory) private readonly categoryRepository: Repository<ServiceCategory>,
    @InjectRepository(ServiceOffering) private readonly serviceRepository: Repository<ServiceOffering>,
    @InjectRepository(CityServiceOffering) private readonly mappingRepository: Repository<CityServiceOffering>,
    private readonly cityService: CityService,
    private readonly auditService: AuditService,
  ) {}

  async listActiveAppliances(): Promise<ApplianceType[]> {
    return this.applianceRepository.find({ where: { isActive: true }, order: { displayOrder: 'ASC', name: 'ASC' } });
  }

  async listServicesForAppliance(applianceId: string, cityId: string): Promise<ServiceOffering[]> {
    const appliance = await this.applianceRepository.findOne({ where: { id: applianceId, isActive: true } });
    if (!appliance) throw new NotFoundException('Appliance is not available');
    await this.cityService.validateActiveCityForActor({ role: UserRole.SUPER_ADMIN }, cityId);
    const rows = await this.mappingRepository.createQueryBuilder('mapping')
      .innerJoinAndSelect('mapping.serviceOffering', 'service')
      .innerJoinAndSelect('service.serviceCategory', 'category')
      .where('mapping.cityId = :cityId', { cityId })
      .andWhere('mapping.isActive = true')
      .andWhere('service.applianceTypeId = :applianceId', { applianceId })
      .andWhere('service.isActive = true')
      .andWhere('category.isActive = true')
      .orderBy('mapping.displayOrder', 'ASC')
      .addOrderBy('service.displayOrder', 'ASC')
      .addOrderBy('service.name', 'ASC')
      .getMany();
    return rows.map((row) => row.serviceOffering);
  }

  async listAdminAppliances(actor: any, _query: CatalogListQueryDto = {}): Promise<ApplianceType[]> { this.assertSuperAdminOrRead(actor); return this.applianceRepository.find({ order: { displayOrder: 'ASC', name: 'ASC' } }); }
  async listAdminCategories(actor: any): Promise<ServiceCategory[]> { this.assertSuperAdminOrRead(actor); return this.categoryRepository.find({ order: { displayOrder: 'ASC', name: 'ASC' } }); }
  async listAdminServices(actor: any): Promise<ServiceOffering[]> { this.assertSuperAdminOrRead(actor); return this.serviceRepository.find({ order: { displayOrder: 'ASC', name: 'ASC' } }); }
  async listAdminMappings(actor: any): Promise<CityServiceOffering[]> { this.assertSuperAdminOrRead(actor); return this.mappingRepository.find({ order: { createdAt: 'DESC' } }); }

  async createAppliance(actor: any, input: CreateApplianceTypeDto): Promise<ApplianceType> { this.assertSuperAdmin(actor); return this.createWithAudit(this.applianceRepository, input, 'catalog.appliance_created', actor); }
  async updateAppliance(actor: any, id: string, input: UpdateApplianceTypeDto): Promise<ApplianceType> { this.assertSuperAdmin(actor); return this.updateWithAudit(this.applianceRepository, id, input, 'catalog.appliance_updated', actor); }
  async setApplianceActive(actor: any, id: string, active: boolean): Promise<ApplianceType> { this.assertSuperAdmin(actor); return this.setActive(this.applianceRepository, id, active, active ? 'catalog.appliance_activated' : 'catalog.appliance_deactivated', actor); }

  async createCategory(actor: any, input: CreateServiceCategoryDto): Promise<ServiceCategory> { this.assertSuperAdmin(actor); return this.createWithAudit(this.categoryRepository, input, 'catalog.category_created', actor); }
  async updateCategory(actor: any, id: string, input: UpdateServiceCategoryDto): Promise<ServiceCategory> { this.assertSuperAdmin(actor); return this.updateWithAudit(this.categoryRepository, id, input, 'catalog.category_updated', actor); }
  async setCategoryActive(actor: any, id: string, active: boolean): Promise<ServiceCategory> { this.assertSuperAdmin(actor); return this.setActive(this.categoryRepository, id, active, active ? 'catalog.category_activated' : 'catalog.category_deactivated', actor); }

  async createService(actor: any, input: CreateServiceOfferingDto): Promise<ServiceOffering> {
    this.assertSuperAdmin(actor);
    await this.requireActiveParents(input.applianceTypeId, input.serviceCategoryId);
    return this.createWithAudit(this.serviceRepository, input, 'catalog.service_created', actor);
  }
  async updateService(actor: any, id: string, input: UpdateServiceOfferingDto): Promise<ServiceOffering> {
    this.assertSuperAdmin(actor);
    const existing = await this.require(this.serviceRepository, id);
    await this.requireActiveParents(input.applianceTypeId ?? existing.applianceTypeId, input.serviceCategoryId ?? existing.serviceCategoryId);
    return this.updateWithAudit(this.serviceRepository, id, input, 'catalog.service_updated', actor);
  }
  async setServiceActive(actor: any, id: string, active: boolean): Promise<ServiceOffering> { this.assertSuperAdmin(actor); return this.setActive(this.serviceRepository, id, active, active ? 'catalog.service_activated' : 'catalog.service_deactivated', actor); }

  async createMapping(actor: any, input: CreateCityServiceOfferingDto): Promise<CityServiceOffering> {
    this.assertSuperAdmin(actor);
    await this.cityService.validateActiveCityForActor(actor, input.cityId);
    await this.requireActiveService(input.serviceOfferingId);
    try { return await this.createWithAudit(this.mappingRepository, input, 'catalog.city_service_created', actor); }
    catch (error) { if ((error as any)?.code === '23505') throw new ConflictException('City service mapping already exists'); throw error; }
  }
  async updateMapping(actor: any, id: string, input: UpdateCityServiceOfferingDto): Promise<CityServiceOffering> {
    this.assertSuperAdmin(actor);
    const existing = await this.require(this.mappingRepository, id);
    await this.cityService.validateActiveCityForActor(actor, input.cityId ?? existing.cityId);
    await this.requireActiveService(input.serviceOfferingId ?? existing.serviceOfferingId);
    return this.updateWithAudit(this.mappingRepository, id, input, 'catalog.city_service_updated', actor);
  }
  async setMappingActive(actor: any, id: string, active: boolean): Promise<CityServiceOffering> { this.assertSuperAdmin(actor); return this.setActive(this.mappingRepository, id, active, active ? 'catalog.city_service_activated' : 'catalog.city_service_deactivated', actor); }

  private async requireActiveParents(applianceId: string, categoryId: string): Promise<void> {
    const appliance = await this.applianceRepository.findOne({ where: { id: applianceId, isActive: true } });
    const category = await this.categoryRepository.findOne({ where: { id: categoryId, isActive: true } });
    if (!appliance || !category) throw new ForbiddenException('Active appliance and service category are required');
  }
  private async requireActiveService(id: string): Promise<ServiceOffering> {
    const service = await this.serviceRepository.findOne({ where: { id, isActive: true } });
    if (!service) throw new ForbiddenException('Active service offering is required');
    return service;
  }
  private async require<T extends object>(repository: Repository<T>, id: string): Promise<T> { const item = await repository.findOne({ where: { id } as any }); if (!item) throw new NotFoundException('Catalogue record not found'); return item; }
  private async createWithAudit<T extends object>(repository: Repository<T>, input: any, eventType: string, actor: any): Promise<T> { const item = repository.create(this.normalize(input)); try { const saved = await repository.save(item) as T; await this.audit(eventType, actor, saved); return saved; } catch (error) { if ((error as any)?.code === '23505') throw new ConflictException('Catalogue code already exists'); throw error; } }
  private async updateWithAudit<T extends object>(repository: Repository<T>, id: string, input: any, eventType: string, actor: any): Promise<T> { const item = await this.require(repository, id); Object.assign(item, this.normalize(input)); try { const saved = await repository.save(item); await this.audit(eventType, actor, saved); return saved; } catch (error) { if ((error as any)?.code === '23505') throw new ConflictException('Catalogue code already exists'); throw error; } }
  private async setActive<T extends { isActive: boolean }>(repository: Repository<T>, id: string, active: boolean, eventType: string, actor: any): Promise<T> { const item = await this.require(repository, id); item.isActive = active; const saved = await repository.save(item); await this.audit(eventType, actor, saved); return saved; }
  private normalize(input: any): any { return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])); }
  private audit(eventType: string, actor: any, item: any): Promise<any> { return this.auditService.log({ eventType, action: 'update', entityType: 'Catalogue', entityId: item.id, userId: actor.sub, userRole: actor.role, status: 'success', severity: 'medium', metadata: { catalogueId: item.id, code: item.code, actorId: actor.sub } }); }
  private assertSuperAdmin(actor: any): void { if (actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only Super Admin can mutate catalogue'); }
  private assertSuperAdminOrRead(actor: any): void { if (![UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) throw new ForbiddenException('Access denied'); }
}
