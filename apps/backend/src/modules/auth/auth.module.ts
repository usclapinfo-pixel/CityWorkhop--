import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OTPService } from './services/otp.service';
import { MagicLinkService } from './services/magic-link.service';
import { User } from '@modules/users/entities/user.entity';
import { OTPToken } from './entities/otp-token.entity';
import { MagicLink } from './entities/magic-link.entity';
import { CommunicationModule } from '@modules/communication/communication.module';
import { SharedModule } from '@modules/shared/shared.module';
import { RateLimitService } from '@common/services/rate-limit.service';
import { IdempotencyService } from '@common/services/idempotency.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OTPToken, MagicLink]),
    forwardRef(() => CommunicationModule),
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OTPService,
    MagicLinkService,
    RateLimitService,
    IdempotencyService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
