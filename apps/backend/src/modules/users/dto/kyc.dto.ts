import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycDocumentType } from '../enums/kyc.enum';

export class SubmitKycDocumentDto {
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @IsString()
  @MaxLength(1000)
  storageReference: string;

  @IsOptional()
  @IsObject()
  documentMetadata?: Record<string, any>;
}

export class KycDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
