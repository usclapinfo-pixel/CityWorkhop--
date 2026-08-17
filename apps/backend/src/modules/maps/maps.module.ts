import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapsConfig } from './entities/maps-config.entity';
import { MapsService } from './services/maps.service';
import { MockMapsProvider } from './providers/mock-maps.provider';
import { GoogleMapsProvider } from './providers/google-maps.provider';
import { MapsConfigService } from './services/maps-config.service';
import { MapsAdminController } from './controllers/maps-admin.controller';
import { MapsConfigController } from './controllers/maps-config.controller';

@Module({
  controllers: [MapsAdminController, MapsConfigController],
  imports: [
    TypeOrmModule.forFeature([MapsConfig]),
  ],
  providers: [
    MapsService,
    MapsConfigService,
    MockMapsProvider,
    GoogleMapsProvider,
  ],
  exports: [
    MapsService,
    MapsConfigService,
  ],
})
export class MapsModule {}
