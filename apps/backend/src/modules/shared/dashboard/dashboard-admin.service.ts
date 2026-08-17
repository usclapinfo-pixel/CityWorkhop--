import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAdminService } from '../audit/audit-admin.service';
import { KycRecord } from '@modules/users/entities/kyc-record.entity';
import { User } from '@modules/users/entities/user.entity';
import { UserManagementService } from '@modules/users/services/user-management.service';
import { AccountStatus } from '@modules/users/enums/account-status.enum';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { KycVerificationStatus } from '@modules/users/enums/kyc.enum';
import { City } from '@modules/cities/entities/city.entity';

@Injectable()
export class DashboardAdminService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(KycRecord) private readonly kycRepository: Repository<KycRecord>,
    @InjectRepository(City) private readonly cityRepository: Repository<City>,
    private readonly userManagementService: UserManagementService,
    private readonly auditAdminService: AuditAdminService,
  ) {}

  async getSummary(actor: any): Promise<any> {
    const scopeIds = await this.userManagementService.getScopedUserIds(actor);
    const users = await this.getUserCounts(actor, scopeIds);
    const kyc = await this.getKycCounts(actor, scopeIds);
    const recent = await this.auditAdminService.list(actor, { page: 1, limit: 10 });
    const cities = await this.getCitySummary(actor);

    return {
      users: {
        total: users.total,
        pending: users.pending,
        approved: users.approved,
        active: users.active,
        suspended: users.suspended,
        rejected: users.rejected,
        deactivated: users.deactivated,
      },
      roles: {
        customers: users.customers,
        technicians: users.technicians,
        vendors: users.vendors,
        riders: users.riders,
        activeTechnicians: users.activeTechnicians,
        activeVendors: users.activeVendors,
        activeRiders: users.activeRiders,
        franchiseOwners: users.franchiseOwners,
        cityAdmins: users.cityAdmins,
      },
      kyc,
      recentActivity: recent.data,
      cities,
      cityOverviewAvailable: true,
    };
  }

  private async getCitySummary(actor: any): Promise<any[]> {
    const builder = this.cityRepository.createQueryBuilder('city')
      .leftJoin(User, 'user', 'user."defaultCityId" = city.id OR city.id = ANY(user."authorizedCityIds")')
      .select([
        'city.id AS id',
        'city.name AS name',
        'city.state AS state',
        'city.district AS district',
        'city."isActive" AS "isActive"',
        'COUNT(user.id)::int AS users',
        'COUNT(user.id) FILTER (WHERE user.role = :technician)::int AS technicians',
        'COUNT(user.id) FILTER (WHERE user.role = :vendor)::int AS vendors',
        'COUNT(user.id) FILTER (WHERE user.role = :rider)::int AS riders',
        'COUNT(user.id) FILTER (WHERE user.status IN (:...pendingStatuses))::int AS pending',
      ])
      .setParameters({ technician: UserRole.TECHNICIAN, vendor: UserRole.VENDOR, rider: UserRole.RIDER, pendingStatuses: [AccountStatus.PENDING, AccountStatus.KYC_SUBMITTED, AccountStatus.UNDER_REVIEW] })
      .groupBy('city.id');
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const ids = actor.city_ids ?? actor.authorizedCityIds ?? [];
      if (!ids.length) return [];
      builder.where('city.id IN (:...cityIds)', { cityIds: ids });
    }
    return builder.orderBy('city.name', 'ASC').getRawMany();
  }

  private async getUserCounts(actor: any, scopeIds: string[]): Promise<Record<string, number>> {
    if (actor.role !== UserRole.SUPER_ADMIN && scopeIds.length === 0) return this.emptyCounts();
    const builder = this.userRepository.createQueryBuilder('user');
    if (actor.role !== UserRole.SUPER_ADMIN) builder.where('user.id IN (:...scopeIds)', { scopeIds });
    const row = await builder.select([
      'COUNT(*)::int AS total',
      'COUNT(*) FILTER (WHERE user.status = :pending)::int AS pending',
      'COUNT(*) FILTER (WHERE user.status = :approved)::int AS approved',
      'COUNT(*) FILTER (WHERE user.status = :active)::int AS active',
      'COUNT(*) FILTER (WHERE user.status = :suspended)::int AS suspended',
      'COUNT(*) FILTER (WHERE user.status = :rejected)::int AS rejected',
      'COUNT(*) FILTER (WHERE user.status = :deactivated)::int AS deactivated',
      'COUNT(*) FILTER (WHERE user.role = :customer)::int AS customers',
      'COUNT(*) FILTER (WHERE user.role = :technician)::int AS technicians',
      'COUNT(*) FILTER (WHERE user.role = :vendor)::int AS vendors',
      'COUNT(*) FILTER (WHERE user.role = :rider)::int AS riders',
      'COUNT(*) FILTER (WHERE user.role = :technician AND user.status = :active)::int AS "activeTechnicians"',
      'COUNT(*) FILTER (WHERE user.role = :vendor AND user.status = :active)::int AS "activeVendors"',
      'COUNT(*) FILTER (WHERE user.role = :rider AND user.status = :active)::int AS "activeRiders"',
      'COUNT(*) FILTER (WHERE user.role = :franchiseOwner)::int AS "franchiseOwners"',
      'COUNT(*) FILTER (WHERE user.role = :cityAdmin)::int AS "cityAdmins"',
    ]).setParameters({
      pending: AccountStatus.PENDING,
      approved: AccountStatus.APPROVED,
      active: AccountStatus.ACTIVE,
      suspended: AccountStatus.SUSPENDED,
      rejected: AccountStatus.REJECTED,
      deactivated: AccountStatus.DEACTIVATED,
      customer: UserRole.CUSTOMER,
      technician: UserRole.TECHNICIAN,
      vendor: UserRole.VENDOR,
      rider: UserRole.RIDER,
      franchiseOwner: UserRole.FRANCHISE_OWNER,
      cityAdmin: UserRole.CITY_ADMIN,
    }).getRawOne();
    return Object.fromEntries(Object.entries(row ?? this.emptyCounts()).map(([key, value]) => [key, Number(value ?? 0)]));
  }

  private async getKycCounts(actor: any, scopeIds: string[]): Promise<Record<string, number>> {
    if (actor.role !== UserRole.SUPER_ADMIN && !scopeIds.length) return { pending: 0, underReview: 0, verified: 0, rejected: 0, correctionRequired: 0 };
    const builder = this.kycRepository.createQueryBuilder('kyc');
    if (actor.role !== UserRole.SUPER_ADMIN) builder.where('kyc.userId IN (:...scopeIds)', { scopeIds });
    const row = await builder
      .select([
        'COUNT(*) FILTER (WHERE kyc.verificationStatus = :pending)::int AS pending',
        'COUNT(*) FILTER (WHERE kyc.verificationStatus = :underReview)::int AS "underReview"',
        'COUNT(*) FILTER (WHERE kyc.verificationStatus = :verified)::int AS verified',
        'COUNT(*) FILTER (WHERE kyc.verificationStatus = :rejected)::int AS rejected',
        'COUNT(*) FILTER (WHERE kyc.verificationStatus = :correctionRequired)::int AS "correctionRequired"',
      ])
      .setParameters({
        pending: 'PENDING',
        underReview: 'UNDER_REVIEW',
        verified: KycVerificationStatus.VERIFIED,
        rejected: KycVerificationStatus.REJECTED,
        correctionRequired: KycVerificationStatus.CORRECTION_REQUIRED,
      })
      .getRawOne();
    return Object.fromEntries(Object.entries(row ?? {}).map(([key, value]) => [key, Number(value ?? 0)]));
  }

  private emptyCounts(): Record<string, number> {
    return {
      total: 0, pending: 0, approved: 0, active: 0, suspended: 0, rejected: 0, deactivated: 0,
      customers: 0, technicians: 0, vendors: 0, riders: 0, activeTechnicians: 0, activeVendors: 0, activeRiders: 0, franchiseOwners: 0, cityAdmins: 0,
    };
  }
}
