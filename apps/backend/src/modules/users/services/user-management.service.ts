import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '@modules/shared/audit/audit.service';
import { User } from '../entities/user.entity';
import { KycRecord } from '../entities/kyc-record.entity';
import { UserRole } from '../enums/user-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { KycSubmissionStatus, KycVerificationStatus } from '../enums/kyc.enum';
import { KycDecisionDto } from '../dto/kyc.dto';
import { CityAssignmentDto } from '@modules/cities/dto/city.dto';
import { CityService } from '@modules/cities/services/city.service';

@Injectable()
export class UserManagementService {
  private readonly approvalRoles = [
    UserRole.ADMIN,
    UserRole.CITY_ADMIN,
    UserRole.SUPER_ADMIN,
  ];

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(KycRecord) private readonly kycRepository: Repository<KycRecord>,
    private readonly auditService: AuditService,
    private readonly cityService: CityService,
  ) {}

  async listPending(actor: any): Promise<any[]> {
    const users = await this.userRepository.find({
      where: { status: In([AccountStatus.PENDING, AccountStatus.KYC_SUBMITTED, AccountStatus.UNDER_REVIEW, AccountStatus.REJECTED]) },
      order: { createdAt: 'ASC' },
    });
    return users.filter((user) => this.canManage(actor, user)).map((user) => this.toSafeUser(user));
  }

  async getUser(actor: any, userId: string): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    return this.toSafeUser(user);
  }

  async getKyc(actor: any, userId: string): Promise<any[]> {
    await this.findScopedUser(actor, userId);
    const records = await this.kycRepository.find({ where: { userId }, order: { createdAt: 'ASC' } });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      documentType: record.documentType,
      documentMetadata: record.documentMetadata,
      submissionStatus: record.submissionStatus,
      verificationStatus: record.verificationStatus,
      verifiedBy: record.verifiedBy,
      verifiedAt: record.verifiedAt,
      rejectionReason: record.rejectionReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async startReview(actor: any, userId: string): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const records = await this.kycRepository.find({ where: { userId } });
    if (records.length === 0) {
      throw new BadRequestException('KYC submission is required before review');
    }

    await this.kycRepository.update({ userId }, {
      submissionStatus: KycSubmissionStatus.UNDER_REVIEW,
    });
    await this.userRepository.update(userId, { status: AccountStatus.UNDER_REVIEW });
    await this.auditDecision('user.kyc_under_review', 'update', actor, user, 'success', 'medium');
    return this.getUser(actor, userId);
  }

  async approve(actor: any, userId: string): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const records = await this.kycRepository.find({ where: { userId } });
    if (user.role !== UserRole.CUSTOMER && records.length === 0) {
      throw new BadRequestException('KYC submission is required before approval');
    }

    await this.kycRepository.update({ userId }, {
      submissionStatus: KycSubmissionStatus.COMPLETED,
      verificationStatus: KycVerificationStatus.VERIFIED,
      verifiedByUser: { id: actor.sub },
      verifiedAt: new Date(),
      rejectionReason: undefined,
    });
    await this.userRepository.update(userId, {
      status: AccountStatus.ACTIVE,
      isActive: true,
      kycVerified: user.role === UserRole.CUSTOMER || records.length > 0,
    });
    await this.auditDecision('user.approved', 'update', actor, user, 'success', 'medium');
    await this.auditDecision('user.kyc_approved', 'update', actor, user, 'success', 'medium');
    return this.getUser(actor, userId);
  }

  async reject(actor: any, userId: string, input: KycDecisionDto): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const reason = input.reason?.trim() || 'Application rejected by administrator';
    await this.kycRepository.update({ userId }, {
      submissionStatus: KycSubmissionStatus.COMPLETED,
      verificationStatus: KycVerificationStatus.REJECTED,
      verifiedByUser: { id: actor.sub },
      verifiedAt: new Date(),
      rejectionReason: reason,
    });
    await this.userRepository.update(userId, { status: AccountStatus.REJECTED, isActive: false, kycVerified: false });
    await this.auditDecision('user.rejected', 'update', actor, user, 'success', 'high', reason);
    await this.auditDecision('user.kyc_rejected', 'update', actor, user, 'success', 'high', reason);
    return this.getUser(actor, userId);
  }

  async requestCorrection(actor: any, userId: string, input: KycDecisionDto): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const reason = input.reason?.trim() || 'KYC correction required';
    await this.kycRepository.update({ userId }, {
      submissionStatus: KycSubmissionStatus.COMPLETED,
      verificationStatus: KycVerificationStatus.CORRECTION_REQUIRED,
      verifiedByUser: { id: actor.sub },
      verifiedAt: new Date(),
      rejectionReason: reason,
    });
    await this.userRepository.update(userId, { status: AccountStatus.REJECTED, isActive: false, kycVerified: false });
    await this.auditDecision('user.kyc_correction_requested', 'update', actor, user, 'success', 'medium', reason);
    return this.getUser(actor, userId);
  }

  async suspend(actor: any, userId: string, input: KycDecisionDto): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    await this.userRepository.update(userId, { status: AccountStatus.SUSPENDED, isActive: false });
    await this.auditDecision('user.suspended', 'update', actor, user, 'success', 'high', input.reason);
    return this.getUser(actor, userId);
  }

  async reactivate(actor: any, userId: string): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const nextStatus = user.kycVerified || user.role === UserRole.CUSTOMER ? AccountStatus.ACTIVE : AccountStatus.PENDING;
    await this.userRepository.update(userId, { status: nextStatus, isActive: nextStatus === AccountStatus.ACTIVE });
    await this.auditDecision('user.reactivated', 'update', actor, user, 'success', 'medium');
    return this.getUser(actor, userId);
  }

  async findScopedUser(actor: any, userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!this.canManage(actor, user)) throw new ForbiddenException('User is outside your permitted city scope');
    return user;
  }

  async getScopedUserIds(actor: any): Promise<string[]> {
    if (actor.role === UserRole.SUPER_ADMIN) return [];

    const cityIds = actor.city_ids ?? actor.authorizedCityIds ?? [];
    if (!cityIds.length) return [];
    const users = await this.userRepository.createQueryBuilder('user')
      .where('user."authorizedCityIds" && :cityIds', { cityIds })
      .orWhere('user."defaultCityId" IN (:...cityIds)', { cityIds })
      .select(['user.id'])
      .getMany();
    return users.map((user) => user.id);
  }

  async assignCities(actor: any, userId: string, input: CityAssignmentDto): Promise<any> {
    const user = await this.findScopedUser(actor, userId);
    const authorizedCityIds = input.authorizedCityIds ?? user.authorizedCityIds ?? [];
    for (const cityId of authorizedCityIds) await this.cityService.validateActiveCityForActor(actor, cityId);
    if (input.defaultCityId) await this.cityService.validateActiveCityForActor(actor, input.defaultCityId);
    if (input.defaultCityId && !authorizedCityIds.includes(input.defaultCityId)) {
      throw new BadRequestException('Default city must be included in authorized cities');
    }
    await this.userRepository.update(userId, {
      ...(input.authorizedCityIds ? { authorizedCityIds: input.authorizedCityIds } : {}),
      ...(input.defaultCityId !== undefined ? { defaultCityId: input.defaultCityId } : {}),
    });
    await this.auditDecision('city.user_assigned', 'update', actor, user, 'success', 'medium');
    return this.getUser(actor, userId);
  }

  private canManage(actor: any, target: User): boolean {
    if (!this.approvalRoles.includes(actor?.role)) return false;
    if (actor.role === UserRole.SUPER_ADMIN) return true;
    const permittedCities = new Set<string>(actor.city_ids ?? actor.authorizedCityIds ?? []);
    const targetCities = new Set<string>([
      ...(target.authorizedCityIds ?? []),
      ...(target.defaultCityId ? [target.defaultCityId] : []),
    ]);
    return targetCities.size > 0 && [...targetCities].some((cityId) => permittedCities.has(cityId));
  }

  private toSafeUser(user: User): any {
    const { passwordHash, ...safeUser } = user as any;
    return safeUser;
  }

  private async auditDecision(
    eventType: string,
    action: 'update',
    actor: any,
    target: User,
    status: 'success' | 'failure' | 'warning',
    severity: 'low' | 'medium' | 'high' | 'critical',
    reason?: string,
  ): Promise<void> {
    await this.auditService.log({
      eventType,
      action,
      entityType: 'User',
      entityId: target.id,
      userId: actor.sub,
      userRole: actor.role,
      status,
      severity,
      errorMessage: reason,
      metadata: { targetUserId: target.id, targetRole: target.role },
    });
  }
}
