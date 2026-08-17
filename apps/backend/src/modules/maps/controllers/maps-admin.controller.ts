import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { MapsConfigService } from '../services/maps-config.service';
import { UpdateMapsConfigDto } from '../dto/update-maps-config.dto';

@Controller('api/v1/admin/maps')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class MapsAdminController {
  constructor(
    private readonly mapsConfigService: MapsConfigService,
  ) {}

  @Get()
  async getConfig() {
    const config =
      await this.mapsConfigService.getOrCreateActiveConfig();

    return this.mapsConfigService.maskConfig(config);
  }

  @Patch()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async updateConfig(
    @Body() dto: UpdateMapsConfigDto,
    @Req() req: any,
  ) {
    const config =
      await this.mapsConfigService.updateConfig({
        ...dto,
        updatedBy: req.user?.sub,
      });

    return this.mapsConfigService.maskConfig(config);
  }
}
