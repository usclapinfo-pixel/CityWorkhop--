import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth-context';
import { ApiClientError } from '../services/api-client';
import { activateCity, createCity, deactivateCity, getCities, updateCity } from '../services/city-service';
import type { City, CityQuery } from '../types/city';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Loading, Select, Toast } from '../components/ui';
import { UserRole } from '../types/auth';
import '../styles/cities.css';

const emptyForm = { name: '', state: '', district: '', code: '' };

export function CitiesPage() {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<CityQuery>({ page: 1, limit: 25 });
  const [draft, setDraft] = useState<CityQuery>({ page: 1, limit: 25 });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<City | null>(null);
  const [confirm, setConfirm] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const canManage = user?.role === UserRole.SUPER_ADMIN;

  async function load(next = filters) {
    setLoading(true); setError('');
    try { const result = await getCities(next); setCities(result.data); setMeta(result.meta); }
    catch (reason) { const apiError = reason instanceof ApiClientError ? reason : null; setError(apiError?.status === 403 ? "You don't have permission to view cities." : apiError?.message ?? 'Unable to load cities.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function applyFilters() { const next = { ...draft, page: 1 }; setFilters(next); void load(next); }
  function resetFilters() { const next = { page: 1, limit: 25 }; setDraft(next); setFilters(next); void load(next); }
  function openCreate() { setEditing(null); setForm(emptyForm); }
  function openEdit(city: City) { setEditing(city); setForm({ name: city.name, state: city.state, district: city.district, code: city.code }); }
  async function save() { setBusy(true); try { if (editing) await updateCity(editing.id, form); else await createCity(form); setToast({ message: editing ? 'City updated.' : 'City created.', tone: 'success' }); setEditing(null); setForm(emptyForm); await load(); } catch (reason) { setToast({ message: reason instanceof ApiClientError ? reason.message : 'City could not be saved.', tone: 'error' }); } finally { setBusy(false); } }
  async function toggle() { if (!confirm) return; setBusy(true); try { if (confirm.isActive) await deactivateCity(confirm.id); else await activateCity(confirm.id); setToast({ message: confirm.isActive ? 'City deactivated.' : 'City activated.', tone: 'success' }); setConfirm(null); await load(); } catch (reason) { setToast({ message: reason instanceof ApiClientError ? reason.message : 'City status could not be changed.', tone: 'error' }); } finally { setBusy(false); } }

  if (error) return <div className="page-stack"><div className="eyebrow">CITY MANAGEMENT</div><h1>Cities</h1><ErrorState message={error} /></div>;
  return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">ADMIN / CITY MANAGEMENT</div><h1>Cities</h1><p className="muted">Manage city records within the backend-authorized scope.</p></div>{canManage && <Button onClick={openCreate}>Create city</Button>}</div><Card className="city-filters"><div className="city-filter-grid"><Input aria-label="Search cities" placeholder="Search name or code" value={draft.search ?? ''} onChange={(event) => setDraft({ ...draft, search: event.target.value })} /><Input aria-label="State filter" placeholder="State" value={draft.state ?? ''} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /><Input aria-label="District filter" placeholder="District" value={draft.district ?? ''} onChange={(event) => setDraft({ ...draft, district: event.target.value })} /><Select aria-label="Status filter" value={draft.isActive ?? ''} onChange={(event) => setDraft({ ...draft, isActive: event.target.value })}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></Select><Button onClick={applyFilters}>Apply filters</Button><Button variant="quiet" onClick={resetFilters}>Reset</Button></div></Card>{loading ? <Loading label="Loading cities" /> : cities.length === 0 ? <EmptyState title="No cities found" description="No city records match the current filters or authorized scope." /> : <Card className="responsive-table"><table><thead><tr><th>Name</th><th>State</th><th>District</th><th>Code</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{cities.map((city) => <tr key={city.id}><td><strong>{city.name}</strong></td><td>{city.state}</td><td>{city.district}</td><td>{city.code}</td><td><Badge tone={city.isActive ? 'success' : 'warning'}>{city.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge></td><td>{new Date(city.createdAt).toLocaleDateString()}</td><td>{canManage ? <div className="row-actions"><Button variant="quiet" onClick={() => openEdit(city)}>Edit</Button><Button variant={city.isActive ? 'danger' : 'primary'} onClick={() => setConfirm(city)}>{city.isActive ? 'Deactivate' : 'Activate'}</Button></div> : <span className="muted">Read only</span>}</td></tr>)}</tbody></table></Card>}{editing && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><div className="eyebrow">CITY FORM</div><h2>{editing ? 'Edit city' : 'Create city'}</h2><div className="city-form"><Input aria-label="City name" placeholder="City name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input aria-label="State" placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /><Input aria-label="District" placeholder="District" value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /><Input aria-label="City code" placeholder="CODE" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /><div className="modal-actions"><Button variant="quiet" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={busy || !form.name || !form.state || !form.district || !form.code} onClick={() => void save()}>{busy ? 'Saving…' : 'Save city'}</Button></div></div></div></div>}{confirm && <ConfirmDialog title={`${confirm.isActive ? 'Deactivate' : 'Activate'} ${confirm.name}?`} description="Existing assignments and historical data are preserved. New assignments will respect the city status." confirmLabel={confirm.isActive ? 'Deactivate' : 'Activate'} onConfirm={() => void toggle()} onCancel={() => setConfirm(null)} busy={busy} />}{toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}</div>;
}
