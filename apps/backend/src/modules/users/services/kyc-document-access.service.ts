import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '@modules/shared/audit/audit.service';
import { KycRecord } from '../entities/kyc-record.entity';
import { UserManagementService } from './user-management.service';
import { SupabaseStorageService, type SignedKycDocumentAccess } from './supabase-storage.service';

@Injectable()
export class KycDocumentAccessService {
  constructor(
    @InjectRepository(KycRecord) private readonly kycRepository: Repository<KycRecord>,
    private readonly userManagementService: UserManagementService,
    private readonly storageService: SupabaseStorageService,
    private readonly auditService: AuditService,
  ) {}

  async createAccess(actor: any, userId: string, recordId: string): Promise<SignedKycDocumentAccess> {
    await this.userManagementService.findScopedUser(actor, userId);
    const record = await this.kycRepository.findOne({ where: { id: recordId, userId } });
    if (!record) throw new NotFoundException('KYC document is unavailable');

    const access = await this.storageService.createSignedReadUrl(
      record.storageReference,
      this.getContentType(record.documentMetadata),
    );

    await this.auditService.log({
      eventType: 'user.kyc_document_viewed',
      action: 'read',
      entityType: 'KycRecord',
      entityId: record.id,
      userId: actor.sub,
      userRole: actor.role,
      status: 'success',
      severity: 'medium',
      metadata: {
        targetUserId: userId,
        kycRecordId: record.id,
        documentType: record.documentType,
        actorId: actor.sub,
      },
    });

    return access;
  }

  private getContentType(metadata?: Record<string, any>): string | undefined {
    const contentType = metadata?.mimeType;
    return typeof contentType === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(contentType) ? contentType : undefined;
  }
}
