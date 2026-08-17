import type { AuditLogRecord } from './audit';

export interface DashboardSummary {
  users: { total: number; pending: number; approved: number; active: number; suspended: number; rejected: number; deactivated: number };
  roles: { customers: number; technicians: number; vendors: number; riders: number; activeTechnicians: number; activeVendors: number; activeRiders: number; franchiseOwners: number; cityAdmins: number };
  kyc: { pending: number; underReview: number; verified: number; rejected: number; correctionRequired: number };
  recentActivity: AuditLogRecord[];
  cities: Array<{ id: string; name: string; state: string; district: string; isActive: boolean; users: number; technicians: number; vendors: number; riders: number; pending: number }>;
  cityOverviewAvailable: boolean;
}
