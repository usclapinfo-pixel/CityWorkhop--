import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../services/api-client';
import { getPendingUsers, approveAdminUser, rejectAdminUser, requestAdminUserCorrection } from '../services/admin-user-service';
import type { AdminUser } from '../types/admin';
import { UserRole } from '../types/auth';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Loading, Select, Toast } from '../components/ui';
import { useAuth } from '../store/auth-context';

function displayName(user: AdminUser) { return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unnamed user'; }
function cityOf(user: AdminUser) { return user.defaultCityId ?? user.authorizedCityIds?.[0] ?? 'Unassigned'; }
function kycOf(user: AdminUser) { return user.kycVerified ? 'Verified' : ['KYC_SUBMITTED', 'UNDER_REVIEW'].includes(user.status) ? 'Submitted' : 'Not verified'; }

export function PendingUsersPage() {
  const { user: actor } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [kyc, setKyc] = useState('ALL');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<{ user: AdminUser; type: 'approve' | 'reject' | 'correction' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  async function load() { setLoading(true); setError(''); try { setUsers(await getPendingUsers()); } catch (err) { setError(err instanceof ApiClientError ? err.message : 'Unable to load pending users.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);

  const cityOptions = useMemo(() => actor?.role === UserRole.SUPER_ADMIN ? Array.from(new Set(users.map(cityOf).filter((value) => value !== 'Unassigned'))) : (actor?.authorizedCityIds ?? actor?.city_ids ?? []), [actor, users]);
  const filtered = users.filter((item) => {
    const haystack = `${displayName(item)} ${item.email ?? ''} ${item.phone ?? item.phoneNumber ?? ''} ${item.id}`.toLowerCase();
    return (role === 'ALL' || item.role === role) && (status === 'ALL' || item.status === status) && (kyc === 'ALL' || kycOf(item).toUpperCase() === kyc) && (city === 'ALL' || cityOf(item) === city) && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  async function confirmAction() {
    if (!action) return;
    setBusy(true);
    try {
      if (action.type === 'approve') await approveAdminUser(action.user.id);
      if (action.type === 'reject') await rejectAdminUser(action.user.id, 'Rejected from admin review.');
      if (action.type === 'correction') await requestAdminUserCorrection(action.user.id, 'Please submit corrected KYC information.');
      setToast({ message: `${action.type === 'correction' ? 'Correction requested' : `User ${action.type}d`} successfully.`, tone: 'success' });
      setAction(null); await load();
    } catch (err) { setToast({ message: err instanceof ApiClientError ? err.message : 'Action could not be completed.', tone: 'error' }); }
    finally { setBusy(false); }
  }

  if (loading) return <Loading label="Loading approval queue" />;
  if (error) return <ErrorState message={error} />;

  return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">USERS / APPROVAL QUEUE</div><h1>Pending approvals</h1><p className="muted">Review the scoped users waiting for account or KYC decisions.</p></div><Badge tone="accent">{filtered.length} visible</Badge></div><Card className="filters"><Input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, or user ID" /><Select aria-label="Filter role" value={role} onChange={(event) => setRole(event.target.value)}><option value="ALL">All roles</option>{[UserRole.TECHNICIAN, UserRole.VENDOR, UserRole.RIDER, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER].map((value) => <option key={value} value={value}>{value}</option>)}</Select><Select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{Array.from(new Set(users.map((item) => item.status))).map((value) => <option key={value} value={value}>{value}</option>)}</Select><Select aria-label="Filter KYC" value={kyc} onChange={(event) => setKyc(event.target.value)}><option value="ALL">All KYC states</option><option value="VERIFIED">Verified</option><option value="SUBMITTED">Submitted</option><option value="NOT VERIFIED">Not verified</option></Select><Select aria-label="Filter city" value={city} onChange={(event) => setCity(event.target.value)}><option value="ALL">All permitted cities</option>{cityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Card>{filtered.length === 0 ? <EmptyState title="No users match these filters" description="Try clearing a filter or wait for a new approval application." /> : <Card className="table-card"><div className="responsive-table"><table><thead><tr><th>User</th><th>Role</th><th>Contact</th><th>City</th><th>KYC</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{displayName(item)}</strong><small>{item.id}</small></td><td><Badge>{item.role}</Badge></td><td><span>{item.phone ?? item.phoneNumber ?? '—'}</span><small>{item.email ?? '—'}</small></td><td>{cityOf(item)}</td><td><Badge tone={item.kycVerified ? 'success' : 'warning'}>{kycOf(item)}</Badge></td><td>{item.status}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td><td><div className="row-actions"><Link to={`/admin/users/${item.id}`}>View</Link><Link to={`/admin/users/${item.id}?tab=kyc`}>KYC</Link><Button variant="quiet" onClick={() => setAction({ user: item, type: 'approve' })}>Approve</Button><Button variant="quiet" onClick={() => setAction({ user: item, type: 'correction' })}>Correct</Button></div></td></tr>)}</tbody></table></div></Card>}{action && <ConfirmDialog title={`${action.type === 'approve' ? 'Approve' : action.type === 'correction' ? 'Request correction for' : 'Reject'} ${displayName(action.user)}?`} description="This action updates the account status through the protected backend approval API." confirmLabel={action.type === 'approve' ? 'Approve user' : action.type === 'correction' ? 'Request correction' : 'Reject user'} onConfirm={() => void confirmAction()} onCancel={() => setAction(null)} busy={busy} />}{toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}</div>;
}
