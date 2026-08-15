import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderConfig } from '../entities/provider-config.entity';
import { ProviderCapability } from '../entities/provider-capability.entity';
import { CityProviderMapping } from '../entities/city-provider-mapping.entity';
import { ProviderRoutingRule } from '../entities/provider-routing-rule.entity';
import { CommunicationChannel } from '../interfaces/provider.interface';

@Injectable()
export class ProviderConfigService {
  constructor(
    @InjectRepository(ProviderConfig)
    private readonly providerConfigRepository: Repository<ProviderConfig>,
    @InjectRepository(ProviderCapability)
    private readonly providerCapabilityRepository: Repository<ProviderCapability>,
    @InjectRepository(CityProviderMapping)
    private readonly cityProviderMappingRepository: Repository<CityProviderMapping>,
    @InjectRepository(ProviderRoutingRule)
    private readonly providerRoutingRuleRepository: Repository<ProviderRoutingRule>,
  ) {}

  async createProviderConfig(input: Partial<ProviderConfig>): Promise<ProviderConfig> {
    const config = this.providerConfigRepository.create(input);
    return this.providerConfigRepository.save(config);
  }

  async updateProviderConfig(id: string, input: Partial<ProviderConfig>): Promise<ProviderConfig | null> {
    await this.providerConfigRepository.update(id, input);
    return this.providerConfigRepository.findOne({ where: { id } });
  }

  async getActiveProvidersForChannel(channel: CommunicationChannel, cityId?: string): Promise<ProviderConfig[]> {
    const where: any = { channel, isActive: true };
    if (cityId) {
      where.cityId = cityId;
    }

    return this.providerConfigRepository.find({
      where,
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
  }

  async createCapability(input: Partial<ProviderCapability>): Promise<ProviderCapability> {
    const capability = this.providerCapabilityRepository.create(input);
    return this.providerCapabilityRepository.save(capability);
  }

  async createCityMapping(input: Partial<CityProviderMapping>): Promise<CityProviderMapping> {
    const mapping = this.cityProviderMappingRepository.create(input);
    return this.cityProviderMappingRepository.save(mapping);
  }

  async createRoutingRule(input: Partial<ProviderRoutingRule>): Promise<ProviderRoutingRule> {
    const rule = this.providerRoutingRuleRepository.create(input);
    return this.providerRoutingRuleRepository.save(rule);
  }

  async getProviderCapabilities(providerType: string): Promise<ProviderCapability[]> {
    return this.providerCapabilityRepository.find({ where: { providerType } });
  }
}
