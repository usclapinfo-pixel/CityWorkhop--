import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,99}$/;

export class CreateApplianceTypeDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) @Matches(codePattern) code: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(500) iconReference?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class UpdateApplianceTypeDto extends CreateApplianceTypeDto {}
export class CreateServiceCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) @Matches(codePattern) code: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class UpdateServiceCategoryDto extends CreateServiceCategoryDto {}
export class CreateServiceOfferingDto {
  @IsUUID() serviceCategoryId: string;
  @IsUUID() applianceTypeId: string;
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) @Matches(codePattern) code: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() requiresInspection?: boolean;
  @IsOptional() @IsInt() @Min(1) estimatedDurationMinutes?: number;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class UpdateServiceOfferingDto extends CreateServiceOfferingDto {}
export class CreateCityServiceOfferingDto {
  @IsUUID() cityId: string;
  @IsUUID() serviceOfferingId: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class UpdateCityServiceOfferingDto {
  @IsOptional() @IsUUID() cityId?: string;
  @IsOptional() @IsUUID() serviceOfferingId?: string;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}
export class CatalogListQueryDto {
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  @IsOptional() @IsUUID() cityId?: string;
  @IsOptional() @IsUUID() applianceTypeId?: string;
}
