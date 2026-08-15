import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ProviderConfig } from '../entities/provider-config.entity';
import { ProviderCapability } from '../entities/provider-capability.entity';
import { CityProviderMapping } from '../entities/city-provider-mapping.entity';
import { ProviderRoutingRule } from '../entities/provider-routing-rule.entity';
import { CommunicationChannel, ProviderType } from '../interfaces/provider.interface';

@Injectable()
export class ProviderResolverService {
  private readonly logger = new Logger(ProviderResolverService.name);

  constructor(
    @InjectRepository(ProviderConfig)
    private readonly providerConfigRepository: Repository<ProviderConfig>,
    @InjectRepository(ProviderCapability)
    private readonly capabilityRepository: Repository<ProviderCapability>,
    @InjectRepository(CityProviderMapping)
    private readonly cityMappingRepository: Repository<CityProviderMapping>,
    @InjectRepository(ProviderRoutingRule)
    private readonly routingRuleRepository: Repository<ProviderRoutingRule>,
  ) {}

  async resolveProvider(
    channel: CommunicationChannel,
    cityId?: string,
    moduleName?: string,
    providerType?: ProviderType,
  ): Promise<ProviderConfig | null> {
    const normalizedChannel = channel as ProviderConfig['channel'];
    const providerTypeWhere = providerType as ProviderConfig['providerType'] | undefined;

    const candidate = providerTypeWhere
      ? await this.providerConfigRepository.findOne({
          where: {
            providerType: providerTypeWhere,
            channel: normalizedChannel,
            isActive: true,
            cityId: cityId ?? IsNull(),
          } as FindOptionsWhere<ProviderConfig>,
          order: { priority: 'ASC' },
        })
      : await this.selectPreferredProvider(channel, cityId, moduleName);

    if (!candidate) {
      this.logger.warn(`No active provider resolved for channel=${channel} city=${cityId ?? 'global'} module=${moduleName ?? 'global'}`);
    }

    return candidate;
  }

  private async selectPreferredProvider(
    channel: CommunicationChannel,
    cityId?: string,
    moduleName?: string,
  ): Promise<ProviderConfig | null> {
    const normalizedChannel = channel as ProviderConfig['channel'];

    if (cityId) {
      const mappedWhere: FindOptionsWhere<CityProviderMapping> = {
        cityId,
        channel: normalizedChannel,
        isPrimary: true,
      };

      if (moduleName) {
        mappedWhere.moduleName = moduleName;
      }

      const mapped = await this.cityMappingRepository.findOne({
        where: {
          ...mappedWhere,
          channel: normalizedChannel as CityProviderMapping['channel'],
        },
        relations: ['providerConfigId'],
      });

      if (mapped) {
        const config = await this.providerConfigRepository.findOne({
          where: { id: mapped.providerConfigId, isActive: true },
        });

        if (config) {
          return config;
        }
      }

      const cityFallback = await this.providerConfigRepository.findOne({
        where: {
          cityId,
          channel: normalizedChannel,
          isActive: true,
        } as FindOptionsWhere<ProviderConfig>,
        order: { priority: 'ASC' },
      });

      if (cityFallback) {
        return cityFallback;
      }
    }

    const routingWhere: FindOptionsWhere<ProviderRoutingRule> = {
      cityId: cityId ?? IsNull(),
      channel: normalizedChannel as ProviderRoutingRule['channel'],
      isActive: true,
    };

    if (moduleName) {
      routingWhere.moduleName = moduleName;
    }

    const ruleMatch = await this.routingRuleRepository.findOne({
      where: routingWhere,
      order: { priority: 'ASC' },
    });

    if (ruleMatch) {
      const config = await this.providerConfigRepository.findOne({
        where: {
          providerType: ruleMatch.providerType as ProviderConfig['providerType'],
          channel: normalizedChannel,
          isActive: true,
        } as FindOptionsWhere<ProviderConfig>,
        order: { priority: 'ASC' },
      });

      if (config) {
        return config;
      }
    }

    return this.providerConfigRepository.findOne({
      where: {
        cityId: IsNull(),
        channel: normalizedChannel,
        isActive: true,
      } as FindOptionsWhere<ProviderConfig>,
      order: { priority: 'ASC' },
    });
  }

  async getCapabilities(providerType: string): Promise<ProviderCapability[]> {
    return this.capabilityRepository.find({
      where: { providerType },
      order: { channel: 'ASC' },
    });
  }
}
