import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '@modules/shared/audit/audit.service';
import { User } from '../entities/user.entity';
import { KycRecord } from '../entities/kyc-record.entity';
import { AccountStatus } from '../enums/account-status.enum';
import { KycSubmissionStatus, KycVerificationStatus } from '../enums/kyc.enum';
import { SubmitKycDocumentDto } from '../dto/kyc.dto';

@Injectable()
export class UserKycService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(KycRecord) private readonly kycRepository: Repository<KycRecord>,
    private readonly auditService: AuditService,
  ) {}

  async submitDocument(userId: string, input: SubmitKycDocumentDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if ([AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.DEACTIVATED].includes(user.status)) {
      throw new BadRequestException('KYC cannot be submitted for this account status');
    }

    let record = await this.kycRepository.findOne({ where: { userId, documentType: input.documentType } });
    if (record) {
      record.storageReference = input.storageReference;
      record.documentMetadata = input.documentMetadata;
      record.submissionStatus = KycSubmissionStatus.SUBMITTED;
      record.verificationStatus = KycVerificationStatus.PENDING;
      record.rejectionReason = undefined;
      record.verifiedBy = undefined;
      record.verifiedAt = undefined;
    } else {
      record = this.kycRepository.create({
        userId,
        documentType: input.documentType,
        storageReference: input.storageReference,
        documentMetadata: input.documentMetadata,
        submissionStatus: KycSubmissionStatus.SUBMITTED,
        verificationStatus: KycVerificationStatus.PENDING,
      });
    }

    const saved = await this.kycRepository.save(record);
    await this.userRepository.update(userId, { status: AccountStatus.KYC_SUBMITTED, kycVerified: false });
    await this.auditService.log({
      eventType: 'user.kyc_submitted',
      action: 'create',
      entityType: 'KycRecord',
      entityId: saved.id,
      userId,
      status: 'success',
      severity: 'medium',
      metadata: { documentType: input.documentType },
    });

    return { id: saved.id, documentType: saved.documentType, submissionStatus: saved.submissionStatus, verificationStatus: saved.verificationStatus };
  }
}
