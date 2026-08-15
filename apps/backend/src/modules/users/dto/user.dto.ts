import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  defaultCityId?: string;
  authorizedCityIds: string[];
}

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  defaultCityId?: string;
  authorizedCityIds?: string[];
}

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  isActive: boolean;
  defaultCityId?: string;
  authorizedCityIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
