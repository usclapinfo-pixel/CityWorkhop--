import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/users/entities/user.entity';
import { SharedModule } from '@modules/shared/shared.module';
import { City } from './entities/city.entity';
import { CityController } from './controllers/city.controller';
import { CityService } from './services/city.service';

@Module({
  imports: [TypeOrmModule.forFeature([City, User]), SharedModule],
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService, TypeOrmModule],
})
export class CitiesModule {}
