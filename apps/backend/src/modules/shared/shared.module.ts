import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuditService } from './audit/audit.service';
import { AuditLog } from './audit/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';
import { AuditAdminController } from './audit/audit-admin.controller';
import { AuditAdminService } from './audit/audit-admin.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User]),

    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          algorithm: 'HS256',
        },
      }),
    }),
  ],

  controllers: [
    AuditAdminController,
  ],

  providers: [
    AuditService,
    AuditAdminService,
    JwtAuthGuard,
  ],

  exports: [
    AuditService,
    AuditAdminService,
    JwtModule,
    JwtAuthGuard,
  ],
})
export class SharedModule {}
