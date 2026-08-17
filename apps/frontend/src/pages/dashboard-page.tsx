import { useEffect, useState } from 'react';
import { ApiClientError } from '../services/api-client';
import { getDashboardSummary } from '../services/dashboard-service';
import type { DashboardSummary } from '../types/dashboard';
import { Card, ErrorState, Loading, Button, Badge } from '../components/ui';
import '../styles/dashboard.css';

const metrics: Array<{ label: string; value: (summary: DashboardSummary) => number }> = [
  { label: 'Total users', value: (summary) => summary.users.total },
  { label: 'Pending approvals', value: (summary) => summary.users.pending },
  { label: 'Pending KYC', value: (summary) => summary.kyc.pending },
  { label: 'Active technicians', value: (summary) => summary.roles.activeTechnicians },
  { label: 'Active vendors', value: (summary) => summary.roles.activeVendors },
  { label: 'Active riders', value: (summary) => summary.roles.activeRiders },
  { label: 'Franchise owners', value: (summary) => summary.roles.franchiseOwners },
  { label: 'Suspended users', value: (summary) => summary.users.suspended },
];

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try { setSummary(await getDashboardSummary()); }
    catch (reason) { const apiError = reason instanceof ApiClientError ? reason : null; setError(apiError?.status === 403 ? 'You are not authorized to view the admin dashboard.' : apiError?.message ?? 'Unable to load dashboard data.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <Loading label="Loading dashboard data" />;
  if (error) return <div className="page-stack"><ErrorState message={error} /><Button onClick={() => void load()}>Retry</Button></div>;
  if (!summary) return <ErrorState message="Dashboard data is unavailable." />;
  return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">OVERVIEW / LIVE DATA</div><h1>Admin dashboard</h1><p className="muted">Live counts from your permitted administrative scope.</p></div><div className="dashboard-heading-actions"><Badge tone="accent">Live data</Badge><Button variant="quiet" disabled={refreshing} onClick={() => void load(true)}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button></div></div><div className="metric-grid">{metrics.map((metric, index) => <Card key={metric.label} className="metric-card"><span className="metric-kicker">0{index + 1}</span><strong>{metric.value(summary)}</strong><span>{metric.label}</span><small>From dashboard API</small></Card>)}</div><div className="dashboard-grid"><Card><div className="section-label">KYC OVERVIEW</div><h2>Verification pipeline</h2><div className="readiness-list"><div>Pending <b>{summary.kyc.pending}</b></div><div>Under review <b>{summary.kyc.underReview}</b></div><div>Verified <b>{summary.kyc.verified}</b></div><div>Rejected <b>{summary.kyc.rejected}</b></div><div>Correction required <b>{summary.kyc.correctionRequired}</b></div></div></Card><Card><div className="section-label">USER STATUS</div><h2>Account lifecycle</h2><div className="readiness-list"><div>Approved <b>{summary.users.approved}</b></div><div>Active <b>{summary.users.active}</b></div><div>Rejected <b>{summary.users.rejected}</b></div><div>Deactivated <b>{summary.users.deactivated}</b></div></div></Card></div><Card><div className="section-label">RECENT ACTIVITY</div><h2>Latest administrative events</h2>{summary.recentActivity.length === 0 ? <div className="state-panel"><strong>No recent activity</strong><span>Audit activity will appear here when available.</span></div> : <div className="activity-list">{summary.recentActivity.map((event) => <div key={event.id}><strong>{event.eventType}</strong><span>{event.actorId ?? 'System'} · {new Date(event.createdAt).toLocaleString()}</span></div>)}</div>}</Card><Card><div className="section-label">CITY OVERVIEW</div><h2>Authorized cities</h2>{summary.cities.length === 0 ? <div className="state-panel"><strong>No cities available</strong><span>No city records are available in your permitted scope.</span></div> : <div className="responsive-table"><table><thead><tr><th>City</th><th>Users</th><th>Technicians</th><th>Vendors</th><th>Riders</th><th>Pending</th></tr></thead><tbody>{summary.cities.map((city) => <tr key={city.id}><td><strong>{city.name}</strong><small>{city.state}, {city.district} · {city.isActive ? 'Active' : 'Inactive'}</small></td><td>{city.users}</td><td>{city.technicians}</td><td>{city.vendors}</td><td>{city.riders}</td><td>{city.pending}</td></tr>)}</tbody></table></div>}</Card><Card><div className="section-label">QUICK ACTIONS</div><div className="quick-actions"><a href="/admin/users/pending">Review pending users</a><a href="/admin/users/pending">Review pending KYC</a><a href="/admin/audit-logs">View audit logs</a><a href="/admin/providers">Manage providers</a><a href="/admin/cities">Manage cities</a></div></Card></div>;
}
