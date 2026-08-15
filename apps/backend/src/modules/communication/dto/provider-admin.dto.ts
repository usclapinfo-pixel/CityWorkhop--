import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const providerTypeValues = ['MSG91', 'WHATSAPP', 'LOCAL_WHATSAPP', 'LOCAL_WHATSAPP_API', 'WHATSAPP_BUSINESS_API', 'MANUAL', 'TWILIO', 'SENDGRID', 'N8N'] as const;
const communicationChannelValues = ['sms', 'whatsapp', 'email'] as const;

export class CreateProviderConfigDto {
  @IsIn(providerTypeValues)
  providerType: (typeof providerTypeValues)[number];

  @IsIn(communicationChannelValues)
  channel: (typeof communicationChannelValues)[number];

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsObject()
  retryPolicy?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateProviderConfigDto {
  @IsOptional()
  @IsIn(providerTypeValues)
  providerType?: (typeof providerTypeValues)[number];

  @IsOptional()
  @IsIn(communicationChannelValues)
  channel?: (typeof communicationChannelValues)[number];

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsObject()
  retryPolicy?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ProviderCapabilityDto {
  @IsIn(providerTypeValues)
  providerType: (typeof providerTypeValues)[number];

  @IsIn(communicationChannelValues)
  channel: (typeof communicationChannelValues)[number];

  @IsOptional()
  @IsBoolean()
  supportsOtp?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsMagicLink?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsWhatsApp?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsWebhook?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsAutomation?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ProviderRoutingRuleDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsIn(providerTypeValues)
  providerType: (typeof providerTypeValues)[number];

  @IsIn(communicationChannelValues)
  channel: (typeof communicationChannelValues)[number];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  moduleName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  allowFallback?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateProviderCapabilityDto extends ProviderCapabilityDto {}

export class CityProviderMappingDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  moduleName?: string;

  @IsIn(communicationChannelValues)
  channel: (typeof communicationChannelValues)[number];

  @IsUUID()
  providerConfigId: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isFallback?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TestProviderDto {
  @IsUUID()
  providerId: string;
}
