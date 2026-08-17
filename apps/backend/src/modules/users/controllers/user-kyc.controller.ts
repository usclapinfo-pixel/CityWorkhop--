import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UserKycService } from '../services/user-kyc.service';
import { SubmitKycDocumentDto } from '../dto/kyc.dto';

@Controller('api/v1/users/me/kyc')
@UseGuards(JwtAuthGuard)
export class UserKycController {
  constructor(private readonly userKycService: UserKycService) {}

  @Post('submit')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async submit(@Req() req: any, @Body() dto: SubmitKycDocumentDto) {
    return this.userKycService.submitDocument(req.user.sub, dto);
  }
}
