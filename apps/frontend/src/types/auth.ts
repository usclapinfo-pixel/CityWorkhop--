export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  VENDOR = 'VENDOR',
  RIDER = 'RIDER',
  FRANCHISE_OWNER = 'FRANCHISE_OWNER',
  ADMIN = 'ADMIN',
  CITY_ADMIN = 'CITY_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole;
  status?: string;
  isDemoAccount?: boolean;
  authorizedCityIds?: string[];
  city_ids?: string[];
  kycVerified?: boolean;
  isActive?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  success: boolean;
  data: { user: AuthUser; tokens: AuthTokens };
  meta?: { timestamp: string };
}

export interface OtpResponse {
  success: boolean;
  data: { otpToken: string; expiresIn: number; channel: 'sms' | 'whatsapp' | 'email' };
  meta?: { timestamp: string };
}
