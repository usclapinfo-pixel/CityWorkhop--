import { request } from './api-client';
import type { DashboardSummary } from '../types/dashboard';

export function getDashboardSummary() {
  return request<DashboardSummary>('/api/v1/admin/dashboard/summary');
}
