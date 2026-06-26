import { Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Branches from './Branches'
import Units from './Units'
import EquipmentList from './EquipmentList'
import EquipmentDetail from './EquipmentDetail'
import Transfers from './Transfers'
import Patients from './Patients'
import Requests from './Requests'
import Loans from './Loans'
import Maintenance from './Maintenance'

const ROLE_LABELS: Record<string, string> = {
  national_manager: 'مدیر ملی',
  branch_manager: 'مدیر استان',
  unit_manager: 'مدیر واحد',
  reception: 'پذیرش',
  equipment: 'کارشناس تجهیزات',
  maintenance: 'نگهداری',
  community: 'مشارکت مردمی',
  supervisor: 'ناظر',
  volunteer: 'داوطلب',
}

const NAV_SECTIONS = [
  {
    label: 'عملیات',
    items: [
      { to: '/app', label: 'داشبورد', icon: '📊', exact: true },
      { to: '/app/equipment', label: 'تجهیزات', icon: '🏥' },
      { to: '/app/transfers', label: 'انتقال‌ها', icon: '🔁' },
      { to: '/app/patients', label: 'بیماران', icon: '👤' },
      { to: '/app/requests', label: 'درخواست‌ها', icon: '📝' },
      { to: '/app/loans', label: 'امانت‌ها', icon: '📋' },
      { to: '/app/maintenance', label: 'نگهداری', icon: '🔧' },
    ],
  },
  {
    label: 'سازمان',
    items: [
      { to: '/app/branches', label: 'شعبه‌ها', icon: '🏢' },
      { to: '/app/units', label: 'واحدها', icon: '🏪' },
    ],
  },
  {
    label: 'گزارش‌ها',
    items: [
      { to: '/app/donors', label: 'خیرین', icon: '🤝' },
      { to: '/app/reports', label: 'گزارش‌ها', icon: '📈' },
    ],
  },
]

function DashboardHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-6)' }}>داشبورد</h2>
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'تجهیزات فعال', value: '—' },
          { label: 'امانت‌های جاری', value: '—' },
          { label: 'در انتظار تعمیر', value: '—' },
          { label: 'خیرین ثبت‌شده', value: '—' },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className="card text-center" style={{ padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🚧</div>
        <p className="text-lg font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
          فاز ۲ — ساختار سازمانی و مدل‌های پایه تکمیل شد
        </p>
        <p className="text-sm text-muted">
          از منوی کناری به شعبه‌ها، واحدها، تجهیزات و بیماران دسترسی داشته باشید.
        </p>
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-6)' }}>{title}</h2>
      <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🚧</div>
        <p className="text-lg font-semibold">به زودی…</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/auth/sign-in', { replace: true })
  }

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ''

  function isActive(to: string, exact?: boolean) {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="متامد" className="sidebar-logo" />
          <span className="sidebar-brand">متامد</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <span className="sidebar-section-label">{section.label}</span>
              {section.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-item${isActive(item.to, item.exact) ? ' active' : ''}`}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', flexShrink: 0,
            }}>
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.email}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{roleLabel}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleLogout}>خروج از سامانه</button>
        </div>
      </aside>

      {/* Main content with nested routes */}
      <div className="main-content">
        <header className="topbar">
          <div />
          <div className="flex items-center gap-3">
            <span className="badge badge-blue">{roleLabel}</span>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="branches" element={<Branches />} />
            <Route path="units" element={<Units />} />
            <Route path="equipment" element={<EquipmentList />} />
            <Route path="equipment/:id" element={<EquipmentDetail />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="patients" element={<Patients />} />
            <Route path="requests" element={<Requests />} />
            <Route path="loans" element={<Loans />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="donors" element={<ComingSoon title="خیرین" />} />
            <Route path="reports" element={<ComingSoon title="گزارش‌ها" />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
