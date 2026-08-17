import { useEffect, useState } from 'react';
import { ApiClientError } from '../services/api-client';
import { getAuditLog, getAuditLogs } from '../services/audit-service';
import type { AuditLogQuery, AuditLogRecord } from '../types/audit';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, Select } from '../components/ui';
import '../styles/audit.css';

const actionOptions = ['', 'create', 'update', 'delete', 'read', 'login', 'logout', 'otp_request', 'otp_verify'];
const sensitiveKey = /password|otp|token|secret|credential|api[-_]?key|signed[-_]?url|storage[-_]?reference|authorization|cookie|private[-_]?key/i;

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey.test(key)));
}

export function AuditLogsPage() {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<AuditLogQuery>({ page: 1, limit: 25 });
  const [draft, setDraft] = useState<AuditLogQuery>({ page: 1, limit: 25 });
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(next: AuditLogQuery = filters) {
    setLoading(true); setError('');
    try { const result = await getAuditLogs(next); setRecords(result.records); setMeta(result.meta); }
    catch (reason) { const apiError = reason instanceof ApiClientError ? reason : null; setError(apiError?.status === 403 ? "You don't have permission to view audit logs." : apiError?.message ?? 'Unable to load audit logs.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function applyFilters() { const next = { ...draft, page: 1 }; setFilters(next); void load(next); }
  function resetFilters() { const next = { page: 1, limit: 25 }; setDraft(next); setFilters(next); void load(next); }
  function movePage(page: number) { const next = { ...filters, page }; setFilters(next); setDraft(next); void load(next); }

  if (error) return <div className="page-stack"><div className="eyebrow">ACTIVITY CENTER</div><h1>Audit logs</h1><ErrorState message={error} /></div>;
  return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">ACTIVITY CENTER / SECURITY TRAIL</div><h1>Audit logs</h1><p className="muted">Review protected administrative and account activity within your permitted scope.</p></div><Badge tone="accent">{meta.total} records</Badge></div><Card className="audit-filters"><div className="audit-filter-grid"><Input aria-label="Search audit logs" placeholder="Search action, event or target" value={draft.search ?? ''} onChange={(event) => setDraft({ ...draft, search: event.target.value })} /><Select aria-label="Filter by action" value={draft.action ?? ''} onChange={(event) => setDraft({ ...draft, action: event.target.value })}>{actionOptions.map((option) => <option key={option} value={option}>{option || 'All actions'}</option>)}</Select><Input aria-label="Actor ID" placeholder="Actor ID" value={draft.actorId ?? ''} onChange={(event) => setDraft({ ...draft, actorId: event.target.value })} /><Input aria-label="Target user ID" placeholder="Target user ID" value={draft.targetUserId ?? ''} onChange={(event) => setDraft({ ...draft, targetUserId: event.target.value })} /><Input aria-label="City ID" placeholder="City ID" value={draft.cityId ?? ''} onChange={(event) => setDraft({ ...draft, cityId: event.target.value })} /><Input aria-label="Date from" type="date" value={draft.from?.slice(0, 10) ?? ''} onChange={(event) => setDraft({ ...draft, from: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} /><Input aria-label="Date to" type="date" value={draft.to?.slice(0, 10) ?? ''} onChange={(event) => setDraft({ ...draft, to: event.target.value ? `${event.target.value}T23:59:59.999Z` : '' })} /><div className="audit-filter-actions"><Button onClick={applyFilters}>Apply filters</Button><Button variant="quiet" onClick={resetFilters}>Reset</Button></div></div></Card>{loading ? <Loading label="Loading audit activity" /> : records.length === 0 ? <EmptyState title="No audit activity" description="No records match the current filters in your permitted scope." /> : <><Card className="responsive-table"><table><thead><tr><th>Date & time</th><th>Action</th><th>Actor</th><th>Target</th><th>Target type</th><th>City</th><th>Result</th><th>Details</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} onClick={() => void getAuditLog(record.id).then(setSelected).catch(() => setSelected(record))}><td>{new Date(record.createdAt).toLocaleString()}</td><td><strong>{record.eventType}</strong><small>{record.action}</small></td><td>{record.actorId ?? 'System'}<small>{record.actorRole ?? '—'}</small></td><td>{String(record.entityId ?? record.metadata?.targetUserId ?? '—')}</td><td>{record.entityType ?? '—'}</td><td>{String(record.metadata?.cityId ?? '—')}</td><td><Badge tone={record.status === 'success' ? 'success' : record.status === 'failure' ? 'warning' : 'neutral'}>{record.status ?? '—'}</Badge></td><td><Button variant="quiet" onClick={(event) => { event.stopPropagation(); void getAuditLog(record.id).then(setSelected).catch(() => setSelected(record)); }}>View</Button></td></tr>)}</tbody></table></Card><div className="audit-pagination"><Select aria-label="Page size" value={String(filters.limit ?? 25)} onChange={(event) => { const next = { ...filters, page: 1, limit: Number(event.target.value) }; setFilters(next); setDraft(next); void load(next); }}><option value="25">25 / page</option><option value="50">50 / page</option><option value="100">100 / page</option></Select><span>Page {meta.page} of {Math.max(meta.totalPages, 1)}</span><Button variant="quiet" disabled={meta.page <= 1} onClick={() => movePage(meta.page - 1)}>Previous</Button><Button variant="quiet" disabled={meta.page >= meta.totalPages} onClick={() => movePage(meta.page + 1)}>Next</Button></div></>}{selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="modal audit-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="eyebrow">AUDIT DETAIL</div><h2>{selected.eventType}</h2><dl className="detail-list"><dt>Timestamp</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd><dt>Actor</dt><dd>{selected.actorId ?? 'System'} ({selected.actorRole ?? '—'})</dd><dt>Target</dt><dd>{String(selected.entityId ?? selected.metadata?.targetUserId ?? '—')}</dd><dt>Target type</dt><dd>{selected.entityType ?? '—'}</dd><dt>IP address</dt><dd>{selected.ipAddress ?? '—'}</dd><dt>User agent</dt><dd>{selected.userAgent ?? '—'}</dd><dt>Status</dt><dd>{selected.status ?? '—'}</dd><dt>Details</dt><dd>{selected.description ?? selected.errorMessage ?? '—'}</dd></dl><pre>{JSON.stringify(safeMetadata(selected.metadata), null, 2)}</pre><Button variant="quiet" onClick={() => setSelected(null)}>Close</Button></div></div>}</div>;
}
