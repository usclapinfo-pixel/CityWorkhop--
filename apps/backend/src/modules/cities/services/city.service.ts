import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditService } from '@modules/shared/audit/audit.service';
import { User } from '@modules/users/entities/user.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { City } from '../entities/city.entity';
import { CityListQueryDto, CreateCityDto, UpdateCityDto } from '../dto/city.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City) private readonly cityRepository: Repository<City>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async listCities(actor: any, query: CityListQueryDto = {}): Promise<{ data: City[]; meta: any }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);
    const builder = this.cityRepository.createQueryBuilder('city');
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const ids = actor.city_ids ?? actor.authorizedCityIds ?? [];
      if (!ids.length) return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
      builder.andWhere('city.id IN (:...ids)', { ids });
    }
    const search = query.search?.trim();
    if (search) builder.andWhere(new Brackets((where) => where.where('city.name ILIKE :search', { search: `%${search}%` }).orWhere('city.code ILIKE :search', { search: `%${search}%` })));
    if (query.state) builder.andWhere('city.state ILIKE :state', { state: query.state.trim() });
    if (query.district) builder.andWhere('city.district ILIKE :district', { district: query.district.trim() });
    if (query.isActive) builder.andWhere('city.isActive = :isActive', { isActive: query.isActive === 'true' });
    const [data, total] = await builder.orderBy('city.name', 'ASC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCity(actor: any, id: string): Promise<City> {
    if (![UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
      throw new ForbiddenException('Access denied');
    }
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const authorizedCityIds = await this.getActorCityIds(actor);
      if (!authorizedCityIds.includes(id)) throw new NotFoundException('City not found');
    }

    const city = await this.cityRepository.findOne({ where: { id } });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async createCity(actor: any, input: CreateCityDto): Promise<City> {
    this.assertSuperAdmin(actor);
    const city = this.cityRepository.create(this.normalize(input));
    try {
      const saved = await this.cityRepository.save(city) as unknown as City;
      await this.audit('city.created', actor, saved);
      return saved;
    } catch (error) {
      if ((error as any)?.code === '23505') throw new ConflictException('City code already exists');
      throw error;
    }
  }

  async updateCity(actor: any, id: string, input: UpdateCityDto): Promise<City> {
    this.assertSuperAdmin(actor);
    const city = await this.getCity(actor, id);
    Object.assign(city, this.normalize(input));
    try {
      const saved = await this.cityRepository.save(city);
      await this.audit('city.updated', actor, saved);
      return saved;
    } catch (error) {
      if ((error as any)?.code === '23505') throw new ConflictException('City code already exists');
      throw error;
    }
  }

  async activateCity(actor: any, id: string): Promise<City> { return this.setActive(actor, id, true); }
  async deactivateCity(actor: any, id: string): Promise<City> { return this.setActive(actor, id, false); }

  async validateActiveCityForActor(actor: any, cityId: string): Promise<City> {
    const city = await this.validateCityExists(cityId);
    if (!city.isActive) throw new ForbiddenException('City is inactive');
    await this.assertCityScopeForActor(actor, cityId);
    return city;
  }

  async validateCityExists(cityId: string): Promise<City> {
    const city = await this.cityRepository.findOne({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async getAuthorizedCities(actor: any): Promise<City[]> {
    if (actor.role === UserRole.SUPER_ADMIN) return this.cityRepository.find({ order: { name: 'ASC' } });
    const ids = actor.city_ids ?? actor.authorizedCityIds ?? [];
    if (!ids.length) return [];
    return this.cityRepository.find({ where: ids.map((id: string) => ({ id })), order: { name: 'ASC' } });
  }

  /** Public, unauthenticated projection for guest City selection (no code/audit fields). */
  async listActivePublicCities(): Promise<Array<Pick<City, 'id' | 'name' | 'state' | 'district'>>> {
    const cities = await this.cityRepository.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return cities.map(({ id, name, state, district }) => ({ id, name, state, district }));
  }

  private async setActive(actor: any, id: string, isActive: boolean): Promise<City> {
    this.assertSuperAdmin(actor);
    const city = await this.getCity(actor, id);
    city.isActive = isActive;
    const saved = await this.cityRepository.save(city);
    await this.audit(isActive ? 'city.activated' : 'city.deactivated', actor, saved);
    return saved;
  }

  private assertSuperAdmin(actor: any): void { if (actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only Super Admin can manage cities'); }
  private assertCityScope(actor: any, cityId: string): void { if (actor.role !== UserRole.SUPER_ADMIN && !(actor.city_ids ?? actor.authorizedCityIds ?? []).includes(cityId)) throw new ForbiddenException('City is outside your permitted scope'); }
  private async assertCityScopeForActor(actor: any, cityId: string): Promise<void> {
    if (actor.role === UserRole.SUPER_ADMIN) return;
    const ids = await this.getActorCityIds(actor);
    this.assertCityScope({ ...actor, authorizedCityIds: ids }, cityId);
  }
  private async getActorCityIds(actor: any): Promise<string[]> {
    const ids = actor.city_ids ?? actor.authorizedCityIds;
    if (Array.isArray(ids)) return ids;
    const user = await this.userRepository.findOne({ where: { id: actor.sub } });
    return user?.authorizedCityIds ?? [];
  }
  private normalize(input: any): any { return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])); }
  private async audit(eventType: string, actor: any, city: City): Promise<void> { await this.auditService.log({ eventType, action: 'update', entityType: 'City', entityId: city.id, userId: actor.sub, userRole: actor.role, status: 'success', severity: 'medium', metadata: { cityId: city.id, cityCode: city.code, actorId: actor.sub } }); }
}
