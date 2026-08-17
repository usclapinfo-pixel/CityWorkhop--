import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MapsConfig,
  MapsProvider,
} from '../entities/maps-config.entity';

export interface MapsConfigPublic {
  provider: MapsProvider;
  isActive: boolean;
  googleMapsConfigured: boolean;
  mapId?: string;
}

@Injectable()
export class MapsConfigService {
  constructor(
    @InjectRepository(MapsConfig)
    private readonly repository: Repository<MapsConfig>,
  ) {}

  async getActiveConfig(): Promise<MapsConfig | null> {
    return this.repository.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getOrCreateActiveConfig(): Promise<MapsConfig> {
    const existing = await this.getActiveConfig();

    if (existing) {
      return existing;
    }

    const config = this.repository.create({
      provider: MapsProvider.MOCK,
      isActive: true,
    });

    return this.repository.save(config);
  }

  async getPublicConfig(): Promise<MapsConfigPublic> {
    const config = await this.getOrCreateActiveConfig();

    return {
      provider: config.provider,
      isActive: config.isActive,
      googleMapsConfigured:
        config.provider === MapsProvider.GOOGLE &&
        Boolean(config.browserApiKey?.trim()),
      mapId: config.mapId || undefined,
    };
  }

  async updateConfig(input: {
    provider?: MapsProvider;
    isActive?: boolean;
    browserApiKey?: string;
    routesApiKey?: string;
    mapId?: string;
    updatedBy?: string;
  }): Promise<MapsConfig> {
    const config = await this.getOrCreateActiveConfig();

    if (
      input.provider !== undefined &&
      !Object.values(MapsProvider).includes(input.provider)
    ) {
      throw new BadRequestException(
        'Unsupported Maps provider',
      );
    }

    if (input.provider !== undefined) {
      config.provider = input.provider;
    }

    if (input.isActive !== undefined) {
      config.isActive = input.isActive;
    }

    if (input.browserApiKey !== undefined) {
      config.browserApiKey =
        input.browserApiKey.trim() || undefined;
    }

    if (input.routesApiKey !== undefined) {
      config.routesApiKey =
        input.routesApiKey.trim() || undefined;
    }

    if (input.mapId !== undefined) {
      config.mapId =
        input.mapId.trim() || undefined;
    }

    if (input.updatedBy) {
      config.updatedBy = input.updatedBy;
    }

    return this.repository.save(config);
  }

  async clearBrowserApiKey(updatedBy?: string): Promise<MapsConfig> {
    return this.updateConfig({
      browserApiKey: '',
      updatedBy,
    });
  }

  async clearRoutesApiKey(updatedBy?: string): Promise<MapsConfig> {
    return this.updateConfig({
      routesApiKey: '',
      updatedBy,
    });
  }

  maskConfig(config: MapsConfig) {
    if (!config) {
      throw new NotFoundException(
        'Maps configuration not found',
      );
    }

    return {
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      browserApiKeyConfigured: Boolean(
        config.browserApiKey?.trim(),
      ),
      routesApiKeyConfigured: Boolean(
        config.routesApiKey?.trim(),
      ),
      browserApiKey: config.browserApiKey
        ? '********'
        : undefined,
      routesApiKey: config.routesApiKey
        ? '********'
        : undefined,
      mapId: config.mapId || undefined,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
    };
  }
}
