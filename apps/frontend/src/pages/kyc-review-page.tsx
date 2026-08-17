import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError } from '../services/api-client';
import { getAdminUser, approveAdminUser, rejectAdminUser, requestAdminUserCorrection, reviewAdminUser } from '../services/admin-user-service';
import { getKycRecords } from '../services/kyc-service';
import type { AdminUser, KycRecord } from '../types/admin';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Loading, Toast } from '../components/ui';
import { KycDocumentViewer } from '../components/kyc-document-viewer';
import '../styles/kyc.css';

function nameOf(user: AdminUser) { return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unnamed user'; }
function cityOf(user: AdminUser) { return user.defaultCityId ?? user.authorizedCityIds?.[0] ?? 'Unassigned'; }
function tone(status: string) { return status === 'VERIFIED' || status === 'ACTIVE' ? 'success' as const : status === 'REJECTED' || status === 'CORRECTION_REQUIRED' ? 'warning' as const : 'neutral' as const; }

export function KycReviewPage() {
  const { id = '' } = useParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'review' | 'approve' | 'reject' | 'correction' | null>(null);
  const [viewer, setViewer] = useState<KycRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const [loadedUser, loadedRecords] = await Promise.all([getAdminUser(id), getKycRecords(id)]);
      setUser(loadedUser); setRecords(loadedRecords);
    } catch (reason) {
      const apiError = reason instanceof ApiClientError ? reason : null;
      setError(apiError?.status === 403 ? 'You are not authorized to access this KYC record.' : apiError?.message ?? 'Unable to load KYC review.');
    } finally { setLoading(false); }
  }
  useEffect(() => { if (id) void load(); }, [id]);

  async function confirmAction() {
    if (!action || !id) return;
    setBusy(true);
    try {
      if (action === 'review') await reviewAdminUser(id);
      if (action === 'approve') await approveAdminUser(id);
      if (action === 'reject') await rejectAdminUser(id, 'Rejected from KYC review.');
      if (action === 'correction') await requestAdminUserCorrection(id, 'Please submit corrected KYC information.');
      setAction(null); setToast({ message: 'KYC status updated.', tone: 'success' }); await load();
    } catch (reason) {
      const apiError = reason instanceof ApiClientError ? reason : null;
      setToast({ message: apiError?.status === 403 ? 'You are not authorized to access this KYC record.' : apiError?.message ?? 'KYC action could not be completed.', tone: 'error' });
    } finally { setBusy(false); }
  }

  if (loading) return <Loading label="Loading KYC review" />;
  if (error || !user) return <ErrorState message={error || 'User was not found.'} />;
  const latest = records[records.length - 1];
  return <div className="page-stack"><div className="detail-back"><Link to={`/admin/users/${user.id}`}>← User details</Link></div><div className="page-heading"><div><div className="eyebrow">KYC REVIEW / {user.role}</div><h1>{nameOf(user)}</h1><p className="muted">User ID: {user.id}</p></div><Badge tone={tone(user.status)}>{user.status}</Badge></div><div className="kyc-summary-grid"><Card><div className="section-label">ACCOUNT</div><dl className="detail-list"><dt>Role</dt><dd>{user.role}</dd><dt>City</dt><dd>{cityOf(user)}</dd><dt>Account status</dt><dd>{user.status}</dd><dt>KYC verified</dt><dd><Badge tone={user.kycVerified ? 'success' : 'warning'}>{user.kycVerified ? 'VERIFIED' : 'NOT VERIFIED'}</Badge></dd></dl></Card><Card><div className="section-label">WORKFLOW</div><dl className="detail-list"><dt>Submission status</dt><dd>{latest ? <Badge tone={tone(latest.submissionStatus)}>{latest.submissionStatus}</Badge> : 'No submission'}</dd><dt>Verification status</dt><dd>{latest ? <Badge tone={tone(latest.verificationStatus)}>{latest.verificationStatus}</Badge> : 'No documents'}</dd><dt>Submitted</dt><dd>{latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : 'Unavailable'}</dd><dt>Verified</dt><dd>{latest?.verifiedAt ? new Date(latest.verifiedAt).toLocaleString() : 'Not verified'}</dd></dl>{latest?.rejectionReason && <p className="reason">{latest.rejectionReason}</p>}</Card></div><div className="detail-actions"><Button onClick={() => setAction('review')}>Review</Button><Button onClick={() => setAction('approve')}>Approve</Button><Button variant="quiet" onClick={() => setAction('correction')}>Request correction</Button><Button variant="danger" onClick={() => setAction('reject')}>Reject</Button></div><Card><div className="section-label">DOCUMENTS / PRIVATE STORAGE</div><h2>Submitted documents</h2>{records.length === 0 ? <EmptyState title="No KYC documents" description="No submitted KYC documents are available for this user." /> : <div className="document-grid">{records.map((record) => <div className="document-card" key={record.id}><div><strong>{record.documentType}</strong><small>{record.submissionStatus} · {record.verificationStatus}</small></div><Badge tone={tone(record.verificationStatus)}>{record.verificationStatus}</Badge><small>Private document. Access is requested through the protected backend.</small><Button onClick={() => setViewer(record)}>View</Button></div>)}</div>}</Card>{viewer && <KycDocumentViewer userId={user.id} record={viewer} onClose={() => setViewer(null)} />}{action && <ConfirmDialog title={`${action[0].toUpperCase()}${action.slice(1)} ${nameOf(user)}?`} description="This status change will be processed by the protected backend KYC API." confirmLabel={action === 'correction' ? 'Request correction' : action} onConfirm={() => void confirmAction()} onCancel={() => setAction(null)} busy={busy} />}{toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}</div>;
}
