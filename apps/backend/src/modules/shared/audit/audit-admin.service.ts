import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-admin.dto';

const sensitiveKey = /password|otp|token|secret|credential|api[-_]?key|signed[-_]?url|storage[-_]?reference|authorization|cookie|private[-_]?key/i;

@Injectable()
export class AuditAdminService {
  constructor(
    @InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async list(actor: any, query: AuditLogQueryDto): Promise<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 25);
    const scopeIds = await this.getScopeUserIds(actor, query.cityId);
    const builder = this.auditRepository.createQueryBuilder('audit');

    this.applyScope(builder, actor, scopeIds);
    if (query.action) builder.andWhere('audit.action = :action', { action: query.action });
    if (query.eventType) builder.andWhere('audit.eventType = :eventType', { eventType: query.eventType });
    if (query.actorId) builder.andWhere('audit.userId = :actorId', { actorId: query.actorId });
    if (query.targetUserId) {
      builder.andWhere(new Brackets((where) => where
        .where('audit.entityId = :targetUserId', { targetUserId: query.targetUserId })
        .orWhere(`audit.metadata->>'targetUserId' = :targetUserId`, { targetUserId: query.targetUserId })));
    }
    if (query.from) builder.andWhere('audit.createdAt >= :from', { from: query.from });
    if (query.to) builder.andWhere('audit.createdAt <= :to', { to: query.to });
    if (query.search) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where
        .where('audit.eventType ILIKE :search', { search })
        .orWhere('audit.action ILIKE :search', { search })
        .orWhere('audit.description ILIKE :search', { search })
        .orWhere('audit.email ILIKE :search', { search })
        .orWhere('audit.entityType ILIKE :search', { search })
        .orWhere('audit.entityId::text ILIKE :search', { search })));
    }

    const [records, total] = await builder.orderBy('audit.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      data: records.map((record) => this.toSafeAudit(record)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(actor: any, id: string): Promise<any> {
    const record = await this.auditRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Audit log not found');
    const scopeIds = await this.getScopeUserIds(actor);
    if (actor.role !== UserRole.SUPER_ADMIN && !this.isInScope(record, scopeIds)) {
      throw new ForbiddenException('Audit log is outside your permitted city scope');
    }
    return this.toSafeAudit(record);
  }

  private async getScopeUserIds(actor: any, cityId?: string): Promise<string[]> {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!cityId) return [];
      const users = await this.userRepository.createQueryBuilder('user')
        .where('user."authorizedCityIds" && :cityId', { cityId: [cityId] })
        .orWhere('user."defaultCityId" = :cityId', { cityId })
        .select(['user.id'])
        .getMany();
      return users.map((user) => user.id);
    }

    const cityIds = cityId ? [cityId] : (actor.city_ids ?? actor.authorizedCityIds ?? []);
    if (!cityIds.length) return [];
    if (cityId && !(actor.city_ids ?? actor.authorizedCityIds ?? []).includes(cityId)) {
      throw new ForbiddenException('City is outside your permitted scope');
    }
    const users = await this.userRepository.createQueryBuilder('user')
      .where('user."authorizedCityIds" && :cityIds', { cityIds })
      .orWhere('user."defaultCityId" IN (:...cityIds)', { cityIds })
      .select(['user.id'])
      .getMany();
    return users.map((user) => user.id);
  }

  private applyScope(builder: ReturnType<Repository<AuditLog>['createQueryBuilder']>, actor: any, scopeIds: string[]): void {
    if (actor.role === UserRole.SUPER_ADMIN && scopeIds.length === 0) return;
    if (!scopeIds.length) {
      builder.andWhere('1 = 0');
      return;
    }
    builder.andWhere(new Brackets((where) => where
      .where('audit.userId IN (:...scopeIds)', { scopeIds })
      .orWhere('audit.entityId IN (:...scopeIds)', { scopeIds })
      .orWhere(`audit.metadata->>'targetUserId' IN (:...scopeIds)`, { scopeIds })));
  }

  private isInScope(record: AuditLog, scopeIds: string[]): boolean {
    const targetUserId = record.metadata?.targetUserId;
    return Boolean(
      (record.userId && scopeIds.includes(record.userId)) ||
      (record.entityId && scopeIds.includes(record.entityId)) ||
      (typeof targetUserId === 'string' && scopeIds.includes(targetUserId)),
    );
  }

  private toSafeAudit(record: AuditLog): any {
    return {
      id: record.id,
      eventType: record.eventType,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      actorId: record.userId,
      actorRole: record.userRole,
      email: record.email,
      phoneNumber: record.phoneNumber,
      description: record.description,
      changes: this.sanitize(record.changes),
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      status: record.status,
      errorMessage: this.sanitizeText(record.errorMessage),
      severity: record.severity,
      metadata: this.sanitize(record.metadata),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey.test(key)).map(([key, entry]) => [key, this.sanitize(entry)]));
  }

  private sanitizeText(value?: string): string | undefined {
    if (!value || sensitiveKey.test(value)) return value ? 'Sensitive detail redacted' : undefined;
    return value;
  }
}
