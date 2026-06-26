import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  national_manager: 'مدیر ملی',
  branch_manager: 'مدیر استان',
  unit_manager: 'مدیر واحد',
  reception: 'پذیرش',
  equipment: 'تجهیزات',
  maintenance: 'نگهداری',
  community: 'جامعه',
  supervisor: 'ناظر',
  volunteer: 'داوطلب',
}

const NAV_ITEMS = [
  { to: '/app', label: 'داشبورد', icon: '📊', exact: true },
  { to: '/app/equipment', label: 'تجهیزات', icon: '🏥' },
  { to: '/app/loans', label: 'امانت‌ها', icon: '📋' },
  { to: '/app/maintenance', label: 'نگهداری', icon: '🔧' },
  { to: '/app/donors', label: 'خیرین', icon: '🤝' },
  { to: '/app/reports', label: 'گزارش‌ها', icon: '📈' },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/auth/sign-in', { replace: true })
  }

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ''

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="متامد" className="sidebar-logo" />
          <span className="sidebar-brand">متامد</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">منو اصلی</span>
          {NAV_ITEMS.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-item${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-400))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'var(--font-bold)',
                fontSize: 'var(--text-sm)',
                flexShrink: 0,
              }}
            >
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.full_name || user?.email}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {roleLabel}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleLogout}>
            خروج از سامانه
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <h1 className="text-xl font-semibold">داشبورد</h1>
          <div className="flex items-center gap-3">
            <span className="badge badge-blue">{roleLabel}</span>
          </div>
        </header>

        <main className="page-content">
          {/* KPI row */}
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

          {/* Placeholder */}
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: 'var(--space-16)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🚧</div>
            <p className="text-lg font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
              فاز ۱ — زیرساخت تکمیل شد
            </p>
            <p className="text-sm text-muted">
              ماژول‌های بعدی در فازهای آینده پیاده‌سازی می‌شوند.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
