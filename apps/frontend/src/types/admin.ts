import { UserRole } from './auth';

export interface AdminUser {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  role: UserRole;
  status: string;
  kycVerified?: boolean;
  isActive?: boolean;
  authorizedCityIds?: string[];
  defaultCityId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KycRecord {
  id: string;
  userId: string;
  documentType: 'PAN' | 'VOTER_ID' | 'SELFIE';
  storageReference?: string;
  documentMetadata?: Record<string, unknown>;
  submissionStatus: string;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
