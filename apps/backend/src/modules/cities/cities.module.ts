import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/users/entities/user.entity';
import { SharedModule } from '@modules/shared/shared.module';
import { AuthModule } from '@modules/auth/auth.module';
import { City } from './entities/city.entity';
import { CityController } from './controllers/city.controller';
import { CityService } from './services/city.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([City, User]),
    SharedModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService, TypeOrmModule],
})
export class CitiesModule {}
