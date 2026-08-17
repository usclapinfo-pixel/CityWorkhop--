import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MapsProvider } from '../entities/maps-config.entity';

export class UpdateMapsConfigDto {
  @IsOptional()
  @IsEnum(MapsProvider)
  provider?: MapsProvider;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  browserApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  routesApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mapId?: string;
}
