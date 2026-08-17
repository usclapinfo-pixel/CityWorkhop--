import { UserRole } from '../types/auth';
import { canSeeAllCities, isAdminRole } from './roles';

test('detects admin roles from the backend contract', () => {
  expect(isAdminRole(UserRole.SUPER_ADMIN)).toBe(true);
  expect(isAdminRole(UserRole.CUSTOMER)).toBe(false);
});

test('only Super Admin sees all cities', () => {
  expect(canSeeAllCities({ id: '1', role: UserRole.SUPER_ADMIN })).toBe(true);
  expect(canSeeAllCities({ id: '2', role: UserRole.ADMIN })).toBe(false);
});
