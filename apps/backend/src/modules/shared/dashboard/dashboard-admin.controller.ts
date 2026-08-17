import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { DashboardAdminService } from './dashboard-admin.service';

@Controller('api/v1/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
export class DashboardAdminController {
  constructor(private readonly dashboardAdminService: DashboardAdminService) {}

  @Get('summary')
  async summary(@Req() req: any) {
    return this.dashboardAdminService.getSummary(req.user);
  }
}
