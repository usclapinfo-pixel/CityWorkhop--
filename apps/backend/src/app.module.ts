import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '@config/database.config';
import { HealthController } from './health/health.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { SharedModule } from '@modules/shared/shared.module';
import { CommunicationModule } from '@modules/communication/communication.module';
import { CitiesModule } from '@modules/cities/cities.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { TrackingModule } from '@modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    SharedModule,
    CommunicationModule,
    CitiesModule,
    CatalogModule,
    BookingsModule,
    TrackingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
