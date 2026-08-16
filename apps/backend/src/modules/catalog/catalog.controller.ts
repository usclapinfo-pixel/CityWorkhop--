import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogListQueryDto } from './dto/catalog.dto';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('appliances') listAppliances() { return this.catalogService.listActiveAppliances(); }
  @Get('appliances/:applianceId/services')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  listServices(@Param('applianceId', ParseUUIDPipe) applianceId: string, @Query() query: CatalogListQueryDto) {
    if (!query.cityId) throw new BadRequestException('cityId is required');
    return this.catalogService.listServicesForAppliance(applianceId, query.cityId);
  }
}
