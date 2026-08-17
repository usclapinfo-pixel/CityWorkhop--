import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../services/api-client';
import {
  approveAdminUser,
  getAdminUser,
  getAdminUserKyc,
  reactivateAdminUser,
  rejectAdminUser,
  requestAdminUserCorrection,
  reviewAdminUser,
  suspendAdminUser,
} from '../services/admin-user-service';
import type { AdminUser, KycRecord } from '../types/admin';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Loading,
  Toast,
} from '../components/ui';

function displayName(user?: AdminUser) {
  return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Unnamed user';
}
function cityOf(user?: AdminUser) {
  return user?.defaultCityId ?? user?.authorizedCityIds?.[0] ?? 'Unassigned';
}

export function UserDetailsPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [kyc, setKyc] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<
    'review' | 'approve' | 'reject' | 'correction' | 'suspend' | 'reactivate' | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [loadedUser, loadedKyc] = await Promise.all([getAdminUser(id), getAdminUserKyc(id)]);
      setUser(loadedUser);
      setKyc(loadedKyc);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load user details.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (id) void load();
  }, [id]);

  async function confirmAction() {
    if (!user || !action) return;
    setBusy(true);
    try {
      if (action === 'review') await reviewAdminUser(user.id);
      if (action === 'approve') await approveAdminUser(user.id);
      if (action === 'reject') await rejectAdminUser(user.id, 'Rejected from admin review.');
      if (action === 'correction')
        await requestAdminUserCorrection(user.id, 'Please submit corrected KYC information.');
      if (action === 'suspend') await suspendAdminUser(user.id, 'Suspended from admin review.');
      if (action === 'reactivate') await reactivateAdminUser(user.id);
      setToast({ message: 'User updated successfully.', tone: 'success' });
      setAction(null);
      await load();
    } catch (err) {
      setToast({
        message: err instanceof ApiClientError ? err.message : 'Action could not be completed.',
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Loading user profile" />;
  if (error || !user) return <ErrorState message={error || 'User was not found.'} />;
  const tab = params.get('tab');
  return (
    <div className="page-stack">
      <div className="detail-back">
        <Link to="/admin/users/pending">← Approval queue</Link>
      </div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">USER / {user.role}</div>
          <h1>{displayName(user)}</h1>
          <p className="muted">
            Registered{' '}
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'date unavailable'}
          </p>
        </div>
        <Badge tone={user.status === 'ACTIVE' ? 'success' : 'warning'}>{user.status}</Badge>
      </div>
      <div className="detail-actions">
        <Link className="button button-primary" to={`/admin/users/${user.id}/kyc`}>Review KYC</Link>
        <Button onClick={() => setAction('review')}>Start review</Button>
        <Button onClick={() => setAction('approve')}>Approve</Button>
        <Button variant="quiet" onClick={() => setAction('correction')}>
          Request correction
        </Button>
        <Button variant="danger" onClick={() => setAction('reject')}>
          Reject
        </Button>
        {user.status === 'SUSPENDED' ? (
          <Button onClick={() => setAction('reactivate')}>Reactivate</Button>
        ) : (
          <Button variant="quiet" onClick={() => setAction('suspend')}>
            Suspend
          </Button>
        )}
      </div>
      <div className="detail-grid">
        <Card>
          <div className="section-label">PROFILE</div>
          <h2>Basic information</h2>
          <dl className="detail-list">
            <dt>Name</dt>
            <dd>{displayName(user)}</dd>
            <dt>Email</dt>
            <dd>{user.email ?? '—'}</dd>
            <dt>Phone</dt>
            <dd>{user.phone ?? user.phoneNumber ?? '—'}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
            <dt>City</dt>
            <dd>{cityOf(user)}</dd>
            <dt>Default city</dt>
            <dd>{user.defaultCityId ?? '—'}</dd>
            <dt>Account status</dt>
            <dd>{user.status}</dd>
          </dl>
        </Card>
        <Card className={tab === 'kyc' ? 'focus-card' : ''}>
          <div className="section-label">KYC / SAFE SUMMARY</div>
          <h2>Submitted documents</h2>
          {kyc.length === 0 ? (
            <EmptyState
              title="No KYC records"
              description="No submitted document metadata is available for this user."
            />
          ) : (
            <div className="kyc-list">
              {kyc.map((record) => (
                <div className="kyc-item" key={record.id}>
                  <div>
                    <strong>{record.documentType}</strong>
                    <small>
                      {record.submissionStatus} · {record.verificationStatus}
                    </small>
                  </div>
                  <Badge tone={record.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                    {record.verificationStatus}
                  </Badge>
                  <small>Secure document availability only. No public link exposed.</small>
                  {record.rejectionReason && (
                    <span className="reason">{record.rejectionReason}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      {action && (
        <ConfirmDialog
          title={`${action[0].toUpperCase()}${action.slice(1)} ${displayName(user)}?`}
          description="This status change will be processed by the protected backend admin API and reflected here after completion."
          confirmLabel={
            action === 'reject'
              ? 'Reject user'
              : action === 'correction'
                ? 'Request correction'
                : action
          }
          onConfirm={() => void confirmAction()}
          onCancel={() => setAction(null)}
          busy={busy}
        />
      )}
      {toast && (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
