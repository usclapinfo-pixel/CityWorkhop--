import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesModule } from '@modules/cities/cities.module';
import { SharedModule } from '@modules/shared/shared.module';
import { ApplianceType } from './entities/appliance-type.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServiceOffering } from './entities/service-offering.entity';
import { CityServiceOffering } from './entities/city-service-offering.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CatalogAdminController } from './catalog-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApplianceType, ServiceCategory, ServiceOffering, CityServiceOffering]), CitiesModule, SharedModule],
  controllers: [CatalogController, CatalogAdminController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
