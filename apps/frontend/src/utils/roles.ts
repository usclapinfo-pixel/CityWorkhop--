import { UserRole, type AuthUser } from '../types/auth';

export const adminRoles = [UserRole.ADMIN, UserRole.CITY_ADMIN, UserRole.SUPER_ADMIN] as const;

export function isAdminRole(role?: UserRole): boolean {
  return Boolean(role && adminRoles.includes(role as (typeof adminRoles)[number]));
}

export function canSeeAllCities(user?: AuthUser | null): boolean {
  return user?.role === UserRole.SUPER_ADMIN;
}
