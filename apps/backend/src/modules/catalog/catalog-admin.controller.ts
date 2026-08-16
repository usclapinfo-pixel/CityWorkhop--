import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { CatalogService } from './catalog.service';
import { CreateApplianceTypeDto, CreateCityServiceOfferingDto, CreateServiceCategoryDto, CreateServiceOfferingDto, UpdateApplianceTypeDto, UpdateCityServiceOfferingDto, UpdateServiceCategoryDto, UpdateServiceOfferingDto } from './dto/catalog.dto';

@Controller('api/v1/admin/catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN)
export class CatalogAdminController {
  constructor(private readonly catalogService: CatalogService) {}
  @Get('appliances') appliances(@Req() req: any) { return this.catalogService.listAdminAppliances(req.user); }
  @Get('categories') categories(@Req() req: any) { return this.catalogService.listAdminCategories(req.user); }
  @Get('services') services(@Req() req: any) { return this.catalogService.listAdminServices(req.user); }
  @Get('city-services') mappings(@Req() req: any) { return this.catalogService.listAdminMappings(req.user); }
  @Post('appliances') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) createAppliance(@Req() req: any, @Body() dto: CreateApplianceTypeDto) { return this.catalogService.createAppliance(req.user, dto); }
  @Patch('appliances/:id') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) updateAppliance(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplianceTypeDto) { return this.catalogService.updateAppliance(req.user, id, dto); }
  @Patch('appliances/:id/activate') activateAppliance(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setApplianceActive(req.user, id, true); }
  @Patch('appliances/:id/deactivate') deactivateAppliance(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setApplianceActive(req.user, id, false); }
  @Post('categories') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) createCategory(@Req() req: any, @Body() dto: CreateServiceCategoryDto) { return this.catalogService.createCategory(req.user, dto); }
  @Patch('categories/:id') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) updateCategory(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceCategoryDto) { return this.catalogService.updateCategory(req.user, id, dto); }
  @Patch('categories/:id/activate') activateCategory(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setCategoryActive(req.user, id, true); }
  @Patch('categories/:id/deactivate') deactivateCategory(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setCategoryActive(req.user, id, false); }
  @Post('services') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) createService(@Req() req: any, @Body() dto: CreateServiceOfferingDto) { return this.catalogService.createService(req.user, dto); }
  @Patch('services/:id') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) updateService(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceOfferingDto) { return this.catalogService.updateService(req.user, id, dto); }
  @Patch('services/:id/activate') activateService(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setServiceActive(req.user, id, true); }
  @Patch('services/:id/deactivate') deactivateService(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setServiceActive(req.user, id, false); }
  @Post('city-services') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) createMapping(@Req() req: any, @Body() dto: CreateCityServiceOfferingDto) { return this.catalogService.createMapping(req.user, dto); }
  @Patch('city-services/:id') @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) updateMapping(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCityServiceOfferingDto) { return this.catalogService.updateMapping(req.user, id, dto); }
  @Patch('city-services/:id/activate') activateMapping(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setMappingActive(req.user, id, true); }
  @Patch('city-services/:id/deactivate') deactivateMapping(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.catalogService.setMappingActive(req.user, id, false); }
}
