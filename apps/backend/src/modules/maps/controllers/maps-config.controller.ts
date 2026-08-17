import { Controller, Get } from '@nestjs/common';
import { MapsConfigService } from '../services/maps-config.service';

@Controller('api/v1/config/maps')
export class MapsConfigController {
  constructor(
    private readonly mapsConfigService: MapsConfigService,
  ) {}

  @Get()
  async getPublicConfig() {
    return this.mapsConfigService.getPublicConfig();
  }
}
