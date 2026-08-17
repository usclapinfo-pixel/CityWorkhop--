import { UserKycService } from './user-kyc.service';
import { AccountStatus } from '../enums/account-status.enum';
import { KycDocumentType, KycSubmissionStatus, KycVerificationStatus } from '../enums/kyc.enum';

describe('UserKycService', () => {
  it('submits a secure storage reference and moves the user to KYC_SUBMITTED', async () => {
    const userRepository = {
      findOne: jest.fn(async () => ({ id: 'user-1', status: AccountStatus.PENDING })),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    const kycRepository = {
      findOne: jest.fn(async () => null),
      create: jest.fn((value) => ({ id: 'kyc-1', ...value })),
      save: jest.fn(async (value) => value),
    };
    const auditService = { log: jest.fn(async () => ({ id: 'audit-1' })) };
    const service = new UserKycService(userRepository as any, kycRepository as any, auditService as any);

    const result = await service.submitDocument('user-1', {
      documentType: KycDocumentType.PAN,
      storageReference: 'private://kyc/user-1/pan.enc',
      documentMetadata: { mimeType: 'application/pdf' },
    });

    expect(result).toEqual({
      id: 'kyc-1',
      documentType: KycDocumentType.PAN,
      submissionStatus: KycSubmissionStatus.SUBMITTED,
      verificationStatus: KycVerificationStatus.PENDING,
    });
    expect(kycRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      storageReference: 'private://kyc/user-1/pan.enc',
      verificationStatus: KycVerificationStatus.PENDING,
    }));
    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      status: AccountStatus.KYC_SUBMITTED,
      kycVerified: false,
    });
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'user.kyc_submitted',
      userId: 'user-1',
    }));
  });
});
