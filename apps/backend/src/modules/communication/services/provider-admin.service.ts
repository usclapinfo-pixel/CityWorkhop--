import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProviderConfigService } from '../providers/provider-config.service';
import { AuditService } from '@modules/shared/audit/audit.service';
import { ProviderConfig } from '../entities/provider-config.entity';
import { ProviderCapability } from '../entities/provider-capability.entity';
import { CityProviderMapping } from '../entities/city-provider-mapping.entity';
import { ProviderRoutingRule } from '../entities/provider-routing-rule.entity';
import { ProviderSecretStorageService } from './provider-secret-storage.service';

@Injectable()
export class ProviderAdminService {
  constructor(
    private readonly providerConfigService: ProviderConfigService,
    private readonly auditService: AuditService,
    private readonly providerSecretStorageService: ProviderSecretStorageService,
  ) {}

  private maskSecrets(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskSecrets(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          /secret|token|key|password|apiKey|auth|clientSecret|privateKey|passphrase/i.test(key)
            ? '********'
            : this.maskSecrets(entry),
        ]),
      );
    }

    return value;
  }

  private sanitizeCredentialsForWrite(credentials?: Record<string, any>): Record<string, any> {
    return this.providerSecretStorageService.storeCredentials(credentials ?? {});
  }

  private sanitizeCredentialsForRead(credentials?: Record<string, any>): Record<string, any> {
    return this.providerSecretStorageService.maskCredentials(credentials ?? {});
  }

  private toSafeProviderDto(provider: ProviderConfig) {
    return {
      ...provider,
      credentials: this.sanitizeCredentialsForRead(provider.credentials ?? {}),
    };
  }

  private getProviderReadiness(provider: ProviderConfig): { status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'DISABLED'; isConfigured: boolean; liveCheck: boolean; message: string } {
    const hasCredentials = !!provider.credentials && Object.keys(provider.credentials).length > 0;

    if (!provider.isActive) {
      return {
        status: 'DISABLED',
        isConfigured: hasCredentials,
        liveCheck: false,
        message: 'Provider is disabled. This is a configuration status only; no live external call was made.',
      };
    }

    if (!hasCredentials) {
      return {
        status: 'NOT_CONFIGURED',
        isConfigured: false,
        liveCheck: false,
        message: 'Provider is missing required credentials. This is a configuration/status check only; no live external call was made.',
      };
    }

    return {
      status: 'CONFIGURED',
      isConfigured: true,
      liveCheck: false,
      message: 'Provider has configuration but this endpoint performs a configuration-readiness check only; no live external provider call was made.',
    };
  }

  private validateProviderConfiguration(providerType: string, credentials?: Record<string, any>): void {
    const config = credentials ?? {};

    if (providerType === 'MSG91') {
      const hasApiKey = !!config.apiKey || !!config.authKey || !!config.api_key || !!config.auth_key;
      if (!hasApiKey) {
        throw new BadRequestException('MSG91 provider requires an API key or auth key in credentials.');
      }
      return;
    }

    if (providerType === 'WHATSAPP' || providerType === 'WHATSAPP_BUSINESS_API') {
      const hasApiKey = !!config.apiKey || !!config.token || !!config.accessToken || !!config.phoneNumberId;
      if (!hasApiKey) {
        throw new BadRequestException('WhatsApp provider requires an API key, token, or phoneNumberId in credentials.');
      }
      return;
    }

    if (providerType === 'LOCAL_WHATSAPP') {
      const hasInfo = !!config.botName || !!config.webhookUrl || !!config.localWebhookUrl;
      if (!hasInfo) {
        throw new BadRequestException('Local WhatsApp requires botName or webhookUrl in credentials.');
      }
      return;
    }

    if (providerType === 'LOCAL_WHATSAPP_API') {
      const hasApiUrl = !!config.apiUrl || !!config.baseUrl;
      const hasToken = !!config.token || !!config.apiKey;
      if (!hasApiUrl || !hasToken) {
        throw new BadRequestException('Local WhatsApp API requires apiUrl/baseUrl and token/apiKey in credentials.');
      }
      return;
    }

    if (providerType === 'N8N') {
      const hasWebhook = !!config.webhookUrl || !!config.webhook_url || !!config.baseUrl || !!config.url;
      if (!hasWebhook) {
        throw new BadRequestException('n8n provider requires a webhookUrl, baseUrl, or url in credentials.');
      }
      return;
    }

    if (providerType === 'TWILIO') {
      const hasSid = !!config.accountSid || !!config.account_id;
      const hasToken = !!config.authToken || !!config.token;
      if (!hasSid || !hasToken) {
        throw new BadRequestException('Twilio provider requires accountSid and authToken/token in credentials.');
      }
      return;
    }

    if (providerType === 'SENDGRID') {
      const hasApiKey = !!config.apiKey || !!config.sendgridKey;
      if (!hasApiKey) {
        throw new BadRequestException('SendGrid provider requires an API key in credentials.');
      }
      return;
    }
  }

  async listProviders(): Promise<any[]> {
    const providers = await this.providerConfigService.getAllProviderConfigs();
    return providers.map((provider) => this.toSafeProviderDto(provider));
  }

  async getProvider(id: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return this.toSafeProviderDto(provider);
  }

  async createProvider(input: Partial<ProviderConfig>, userId?: string, userRole?: string): Promise<any> {
    const providerType = input.providerType ?? 'MSG91';
    const safeCredentials = this.sanitizeCredentialsForWrite(input.credentials ?? {});
    this.validateProviderConfiguration(providerType, safeCredentials);

    const provider = await this.providerConfigService.createProviderConfig({
      ...input,
      credentials: safeCredentials,
      isActive: input.isActive ?? false,
      priority: input.priority ?? 0,
    });

    await this.auditService.log({
      eventType: 'communication.provider_create',
      action: 'create',
      entityType: 'ProviderConfig',
      entityId: provider.id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: {
        providerType: provider.providerType,
        channel: provider.channel,
        hasCredentials: !!provider.credentials && Object.keys(provider.credentials).length > 0,
        isActive: provider.isActive,
      },
    });

    return this.toSafeProviderDto(provider);
  }

  async updateProvider(id: string, input: Partial<ProviderConfig>, userId?: string, userRole?: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const nextProviderType = input.providerType ?? provider.providerType;
    const sanitizedCredentials = input.credentials ? this.sanitizeCredentialsForWrite(input.credentials) : provider.credentials;
    this.validateProviderConfiguration(nextProviderType, sanitizedCredentials);

    const updated = await this.providerConfigService.updateProviderConfig(id, {
      ...input,
      credentials: sanitizedCredentials,
      lastTestSuccess: false,
    });
    if (!updated) {
      throw new BadRequestException('Provider could not be updated');
    }

    await this.auditService.log({
      eventType: 'communication.provider_update',
      action: 'update',
      entityType: 'ProviderConfig',
      entityId: id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: {
        providerType: updated.providerType,
        channel: updated.channel,
        hasCredentials: !!updated.credentials && Object.keys(updated.credentials).length > 0,
        isActive: updated.isActive,
      },
    });

    return this.toSafeProviderDto(updated);
  }

  async enableProvider(id: string, userId?: string, userRole?: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const updated = await this.providerConfigService.updateProviderConfig(id, { isActive: true, lastTestSuccess: false });
    if (!updated) {
      throw new BadRequestException('Provider could not be enabled');
    }

    await this.auditService.log({
      eventType: 'communication.provider_enable',
      action: 'update',
      entityType: 'ProviderConfig',
      entityId: id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: { providerType: updated.providerType, isActive: updated.isActive },
    });

    return this.toSafeProviderDto(updated);
  }

  async disableProvider(id: string, userId?: string, userRole?: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const updated = await this.providerConfigService.updateProviderConfig(id, { isActive: false, lastTestSuccess: false });
    if (!updated) {
      throw new BadRequestException('Provider could not be disabled');
    }

    await this.auditService.log({
      eventType: 'communication.provider_disable',
      action: 'update',
      entityType: 'ProviderConfig',
      entityId: id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: { providerType: updated.providerType, isActive: updated.isActive },
    });

    return this.toSafeProviderDto(updated);
  }

  async deactivateProvider(id: string, userId?: string, userRole?: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const updated = await this.providerConfigService.updateProviderConfig(id, { isActive: false, lastTestSuccess: false, description: 'Deactivated by admin' });
    if (!updated) {
      throw new BadRequestException('Provider could not be deactivated');
    }

    await this.auditService.log({
      eventType: 'communication.provider_deactivate',
      action: 'delete',
      entityType: 'ProviderConfig',
      entityId: id,
      userId,
      userRole,
      status: 'success',
      severity: 'high',
      metadata: { providerType: updated.providerType, isActive: updated.isActive },
    });

    return this.toSafeProviderDto(updated);
  }

  async testProvider(id: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const readiness = this.getProviderReadiness(provider);
    const result = {
      providerId: provider.id,
      providerType: provider.providerType,
      channel: provider.channel,
      status: readiness.status,
      liveCheck: readiness.liveCheck,
      isConfigured: readiness.isConfigured,
      lastTestSuccess: false,
      lastTestedAt: new Date(),
      message: `${readiness.message} No real external provider connectivity check was performed in this phase.`,
      mode: 'configuration-readiness-only',
    };

    await this.providerConfigService.updateProviderConfig(id, {
      lastTestedAt: result.lastTestedAt,
      lastTestSuccess: false,
    });

    return result;
  }

  async getProviderHealth(id: string): Promise<any> {
    const provider = await this.providerConfigService.getProviderConfig(id);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const readiness = this.getProviderReadiness(provider);

    return {
      providerId: provider.id,
      providerType: provider.providerType,
      channel: provider.channel,
      isActive: provider.isActive,
      status: readiness.status,
      liveCheck: readiness.liveCheck,
      isConfigured: readiness.isConfigured,
      lastTestSuccess: false,
      lastTestedAt: provider.lastTestedAt ?? null,
      priority: provider.priority ?? 0,
      description: provider.description ?? null,
      mode: 'configuration-readiness-only',
      message: readiness.message,
    };
  }

  async listCapabilities(providerType?: string): Promise<ProviderCapability[]> {
    if (providerType) {
      return this.providerConfigService.getProviderCapabilities(providerType);
    }

    return this.providerConfigService.getAllProviderCapabilities();
  }

  async createCapability(input: Partial<ProviderCapability>, userId?: string, userRole?: string): Promise<ProviderCapability> {
    const capability = await this.providerConfigService.createCapability(input);

    await this.auditService.log({
      eventType: 'communication.provider_capability_create',
      action: 'create',
      entityType: 'ProviderCapability',
      entityId: capability.id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: { providerType: capability.providerType, channel: capability.channel },
    });

    return capability;
  }

  async listRoutingRules(): Promise<ProviderRoutingRule[]> {
    return this.providerConfigService.getAllRoutingRules();
  }

  async createRoutingRule(input: Partial<ProviderRoutingRule>, userId?: string, userRole?: string): Promise<ProviderRoutingRule> {
    const rule = await this.providerConfigService.createRoutingRule(input);

    await this.auditService.log({
      eventType: 'communication.provider_routing_create',
      action: 'create',
      entityType: 'ProviderRoutingRule',
      entityId: rule.id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: { providerType: rule.providerType, channel: rule.channel },
    });

    return rule;
  }

  async listCityMappings(): Promise<CityProviderMapping[]> {
    return this.providerConfigService.getAllCityMappings();
  }

  async createCityMapping(input: Partial<CityProviderMapping>, userId?: string, userRole?: string): Promise<CityProviderMapping> {
    const mapping = await this.providerConfigService.createCityMapping(input);

    await this.auditService.log({
      eventType: 'communication.provider_city_mapping_create',
      action: 'create',
      entityType: 'CityProviderMapping',
      entityId: mapping.id,
      userId,
      userRole,
      status: 'success',
      severity: 'medium',
      metadata: { cityId: mapping.cityId, channel: mapping.channel },
    });

    return mapping;
  }
}
