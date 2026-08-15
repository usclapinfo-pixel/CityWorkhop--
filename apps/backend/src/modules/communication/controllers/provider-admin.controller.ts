import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { ProviderAdminService } from '../services/provider-admin.service';
import {
  CityProviderMappingDto,
  CreateProviderConfigDto,
  ProviderCapabilityDto,
  ProviderRoutingRuleDto,
  UpdateProviderConfigDto,
} from '../dto/provider-admin.dto';

@Controller('api/v1/admin/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ProviderAdminController {
  constructor(private readonly providerAdminService: ProviderAdminService) {}

  @Get()
  async listProviders() {
    return this.providerAdminService.listProviders();
  }

  @Get(':id')
  async getProvider(@Param('id', ParseUUIDPipe) id: string) {
    return this.providerAdminService.getProvider(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createProvider(@Body() dto: CreateProviderConfigDto, @Req() req: any) {
    return this.providerAdminService.createProvider(dto, req.user?.sub, req.user?.role);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProvider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderConfigDto,
    @Req() req: any,
  ) {
    return this.providerAdminService.updateProvider(id, dto, req.user?.sub, req.user?.role);
  }

  @Patch(':id/enable')
  async enableProvider(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.providerAdminService.enableProvider(id, req.user?.sub, req.user?.role);
  }

  @Patch(':id/disable')
  async disableProvider(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.providerAdminService.disableProvider(id, req.user?.sub, req.user?.role);
  }

  @Patch(':id/deactivate')
  async deactivateProvider(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.providerAdminService.deactivateProvider(id, req.user?.sub, req.user?.role);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async testProvider(@Param('id', ParseUUIDPipe) id: string) {
    return this.providerAdminService.testProvider(id);
  }

  @Get(':id/health')
  async getProviderHealth(@Param('id', ParseUUIDPipe) id: string) {
    return this.providerAdminService.getProviderHealth(id);
  }

  @Get('capabilities')
  async listCapabilities() {
    return this.providerAdminService.listCapabilities();
  }

  @Get('capabilities/:providerType')
  async getCapabilitiesByType(@Param('providerType') providerType: string) {
    return this.providerAdminService.listCapabilities(providerType);
  }

  @Post('capabilities')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createCapability(@Body() dto: ProviderCapabilityDto, @Req() req: any) {
    return this.providerAdminService.createCapability(dto, req.user?.sub, req.user?.role);
  }

  @Get('routing')
  async listRoutingRules() {
    return this.providerAdminService.listRoutingRules();
  }

  @Post('routing')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createRoutingRule(@Body() dto: ProviderRoutingRuleDto, @Req() req: any) {
    return this.providerAdminService.createRoutingRule(dto, req.user?.sub, req.user?.role);
  }

  @Get('mappings')
  async listCityMappings() {
    return this.providerAdminService.listCityMappings();
  }

  @Post('mappings')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createCityMapping(@Body() dto: CityProviderMappingDto, @Req() req: any) {
    return this.providerAdminService.createCityMapping(dto, req.user?.sub, req.user?.role);
  }
}
