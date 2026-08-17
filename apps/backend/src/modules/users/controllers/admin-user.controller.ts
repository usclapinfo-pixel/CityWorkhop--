import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { UserManagementService } from '../services/user-management.service';
import { KycDocumentAccessService } from '../services/kyc-document-access.service';
import { KycDecisionDto } from '../dto/kyc.dto';
import { CityAssignmentDto } from '@modules/cities/dto/city.dto';

@Controller('api/v1/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
export class AdminUserController {
  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly kycDocumentAccessService: KycDocumentAccessService,
  ) {}

  @Get('pending')
  async listPending(@Req() req: any) {
    return this.userManagementService.listPending(req.user);
  }

  @Get(':id/kyc')
  async getKyc(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.getKyc(req.user, id);
  }

  @Get(':id/kyc/:recordId/access')
  async getKycDocumentAccess(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
  ) {
    return this.kycDocumentAccessService.createAccess(req.user, id, recordId);
  }

  @Get(':id')
  async getUser(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.getUser(req.user, id);
  }

  @Patch(':id/cities')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  assignCities(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CityAssignmentDto) {
    return this.userManagementService.assignCities(req.user, id, dto);
  }

  @Patch(':id/review')
  async startReview(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.startReview(req.user, id);
  }

  @Patch(':id/approve')
  async approve(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.approve(req.user, id);
  }

  @Patch(':id/reject')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async reject(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: KycDecisionDto) {
    return this.userManagementService.reject(req.user, id, dto);
  }

  @Patch(':id/request-correction')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async requestCorrection(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: KycDecisionDto) {
    return this.userManagementService.requestCorrection(req.user, id, dto);
  }

  @Patch(':id/suspend')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async suspend(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: KycDecisionDto) {
    return this.userManagementService.suspend(req.user, id, dto);
  }

  @Patch(':id/reactivate')
  async reactivate(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.reactivate(req.user, id);
  }
}
