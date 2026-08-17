export enum KycDocumentType {
  PAN = 'PAN',
  VOTER_ID = 'VOTER_ID',
  SELFIE = 'SELFIE',
}

export enum KycSubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum KycVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  CORRECTION_REQUIRED = 'CORRECTION_REQUIRED',
}
