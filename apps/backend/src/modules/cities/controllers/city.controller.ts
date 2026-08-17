import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { CityService } from '../services/city.service';
import { CityListQueryDto, CreateCityDto, UpdateCityDto } from '../dto/city.dto';

@Controller('api/v1/admin/cities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  list(@Req() req: any, @Query() query: CityListQueryDto) { return this.cityService.listCities(req.user, query); }
  @Get(':id') get(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.cityService.getCity(req.user, id); }
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Req() req: any, @Body() dto: CreateCityDto) { return this.cityService.createCity(req.user, dto); }
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCityDto) { return this.cityService.updateCity(req.user, id, dto); }
  @Patch(':id/activate') activate(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.cityService.activateCity(req.user, id); }
  @Patch(':id/deactivate') deactivate(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.cityService.deactivateCity(req.user, id); }
}
