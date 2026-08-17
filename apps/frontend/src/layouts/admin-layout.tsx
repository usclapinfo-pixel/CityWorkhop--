import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../store/auth-context';

const navigation = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '01' },
  { label: 'Users', path: '/admin/users', icon: '02' },
  { label: 'KYC review', path: '/admin/users/pending', icon: '03' },
  { label: 'Cities', path: '/admin/cities', icon: '04' },
  { label: 'Providers', path: '/admin/providers', icon: '05', soon: true },
  { label: 'Audit logs', path: '/admin/audit-logs', icon: '06' },
  { label: 'Settings', path: '/admin/settings', icon: '07', soon: true },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Administrator';

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">CW</span><span><strong>City Workshop</strong><small>Operations console</small></span></div>
        <nav aria-label="Admin navigation">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.soon ? '#' : item.path} className={({ isActive }) => `nav-item ${isActive && !item.soon ? 'active' : ''} ${item.soon ? 'is-soon' : ''}`} onClick={(event) => item.soon && event.preventDefault()}>
              <span className="nav-index">{item.icon}</span><span>{item.label}</span>{item.soon && <span className="nav-soon">Soon</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />Development workspace</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="crumb">ADMIN / <strong>CONTROL CENTER</strong></div><div className="account"><div className="avatar">{name.slice(0, 1).toUpperCase()}</div><div><strong>{name}</strong><small>{user?.role ?? 'ADMIN'}</small></div><Button variant="quiet" onClick={async () => { await logout(); navigate('/login'); }}>Log out</Button></div></header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
