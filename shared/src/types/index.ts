/**
 * Common Types for CITY WORKSHOP
 * Shared across backend and frontend
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CITY_ADMIN = 'city_admin',
  FRANCHISE_OWNER = 'franchise_owner',
  CUSTOMER = 'customer',
  TECHNICIAN = 'technician',
  RIDER = 'rider',
  VENDOR = 'vendor',
}

export interface User {
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
  createdAt: Date;
  updatedAt: Date;
}
