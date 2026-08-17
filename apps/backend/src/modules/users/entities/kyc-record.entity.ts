import { Entity, Column, Index, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { User } from './user.entity';
import {
  KycDocumentType,
  KycSubmissionStatus,
  KycVerificationStatus,
} from '../enums/kyc.enum';

@Entity('user_kyc_records')
@Index(['userId', 'documentType'], { unique: true })
@Index(['userId', 'submissionStatus'])
@Index(['verificationStatus'])
export class KycRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: KycDocumentType })
  documentType: KycDocumentType;

  @Column({ type: 'varchar', length: 1000 })
  storageReference: string;

  @Column({ type: 'jsonb', default: () => "'{}'", nullable: true })
  documentMetadata?: Record<string, any>;

  @Column({ type: 'enum', enum: KycSubmissionStatus, default: KycSubmissionStatus.SUBMITTED })
  submissionStatus: KycSubmissionStatus;

  @Column({ type: 'enum', enum: KycVerificationStatus, default: KycVerificationStatus.PENDING })
  verificationStatus: KycVerificationStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedByUser?: User;

  @RelationId((record: KycRecord) => record.verifiedByUser)
  verifiedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  rejectionReason?: string;
}
