import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { AuditAdminService } from './audit-admin.service';
import { AuditLogQueryDto } from './dto/audit-admin.dto';

@Controller('api/v1/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
export class AuditAdminController {
  constructor(private readonly auditAdminService: AuditAdminService) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async list(@Query() query: AuditLogQueryDto, @Req() req: any) {
    const result = await this.auditAdminService.list(req.user, query);
    return { records: result.data, meta: result.meta };
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.auditAdminService.get(req.user, id);
  }
}
