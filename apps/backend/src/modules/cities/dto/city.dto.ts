import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, Matches } from 'class-validator';

const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,99}$/;

export class CreateCityDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @IsString() @IsNotEmpty() @MaxLength(255) state: string;
  @IsString() @IsNotEmpty() @MaxLength(255) district: string;
  @IsString() @IsNotEmpty() @MaxLength(100) @Matches(codePattern) code: string;
}

export class UpdateCityDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(255) state?: string;
  @IsOptional() @IsString() @MaxLength(255) district?: string;
  @IsOptional() @IsString() @MaxLength(100) @Matches(codePattern) code?: string;
}

export class CityListQueryDto {
  @IsOptional() @IsString() @MaxLength(255) search?: string;
  @IsOptional() @IsString() @MaxLength(255) state?: string;
  @IsOptional() @IsString() @MaxLength(255) district?: string;
  @IsOptional() @IsIn(['true', 'false']) isActive?: string;
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 25;
}

export class CityAssignmentDto {
  @IsOptional() @IsUUID('4', { each: true }) authorizedCityIds?: string[];
  @IsOptional() @IsUUID() defaultCityId?: string;
}
