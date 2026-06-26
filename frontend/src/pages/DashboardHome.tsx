import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../auth/api'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'

interface ChartItem { key: string; label: string; value: number }

interface DashboardData {
  role: string
  role_display: string
  scope: string
  kpis: {
    equipment_total: number
    equipment_ready: number
    equipment_on_loan: number
    active_loans: number
    overdue_loans: number
    pending_requests: number
    patients_total: number
    open_maintenance: number
    unresolved_damage: number
  }
  community: {
    donor_count: number
    volunteer_count: number
    total_cash: number
  }
  charts: {
    equipment_by_status: ChartItem[]
    equipment_by_category: ChartItem[]
    loans_by_status: ChartItem[]
  }
  recent_loans: { id: number; equipment: string; patient: string; status: string; created_at: string }[]
  recent_requests: { id: number; patient: string; category: string; priority: string; status: string; created_at: string }[]
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR')
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<DashboardData>('dashboard/')
      .then(setData)
      .catch(() => setError('خطا در دریافت داشبورد'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
        <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
        در حال بارگذاری…
      </div>
    )
  }
  if (error || !data) return <div className="alert alert-error">{error || 'خطا'}</div>

  const k = data.kpis
  const primaryKpis = [
    { label: 'کل تجهیزات', value: k.equipment_total, accent: 'var(--color-primary-600)' },
    { label: 'آماده خدمت', value: k.equipment_ready, accent: 'var(--color-accent-400)' },
    { label: 'امانت‌های جاری', value: k.active_loans, accent: 'var(--color-primary-600)' },
    { label: 'امانت معوق', value: k.overdue_loans, accent: 'var(--color-danger)' },
  ]
  const secondaryKpis = [
    { label: 'درخواست در انتظار', value: k.pending_requests, to: '/app/requests' },
    { label: 'بیماران', value: k.patients_total, to: '/app/patients' },
    { label: 'تعمیرات باز', value: k.open_maintenance, to: '/app/maintenance' },
    { label: 'آسیب رسیدگی‌نشده', value: k.unresolved_damage, to: '/app/maintenance' },
  ]

  const isManager = ['national_manager', 'branch_manager'].includes(data.role)

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h2 className="text-2xl font-bold">داشبورد {data.role_display}</h2>
          <p className="text-muted text-sm">نمای کلی — {data.scope}</p>
        </div>
        <span className="badge badge-blue" style={{ fontSize: 'var(--text-sm)' }}>📍 {data.scope}</span>
      </div>

      {/* Primary KPIs with accent bar */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-5)' }}>
        {primaryKpis.map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ borderTop: `3px solid ${kpi.accent}` }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ color: kpi.accent }}>{kpi.value.toLocaleString('fa-IR')}</div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs (clickable) */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {secondaryKpis.map(kpi => (
          <Link key={kpi.label} to={kpi.to} className="kpi-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value.toLocaleString('fa-IR')}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>تجهیزات بر اساس وضعیت</h3>
          <BarChart data={data.charts.equipment_by_status} />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>تجهیزات بر اساس دسته‌بندی</h3>
          <DonutChart data={data.charts.equipment_by_category} />
        </div>
      </div>

      {/* Community strip for managers */}
      {isManager && (
        <div className="card" style={{ marginBottom: 'var(--space-8)', background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-accent-50))' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>مشارکت‌های مردمی (سراسری)</h3>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <div>
              <div className="kpi-label">خیرین</div>
              <div className="kpi-value">{data.community.donor_count.toLocaleString('fa-IR')}</div>
            </div>
            <div>
              <div className="kpi-label">داوطلبان فعال</div>
              <div className="kpi-value">{data.community.volunteer_count.toLocaleString('fa-IR')}</div>
            </div>
            <div>
              <div className="kpi-label">مجموع کمک نقدی (ریال)</div>
              <div className="kpi-value">{data.community.total_cash.toLocaleString('fa-IR')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="text-lg font-semibold">آخرین امانت‌ها</h3>
            <Link to="/app/loans" className="text-sm">مشاهده همه ←</Link>
          </div>
          {data.recent_loans.length === 0 ? (
            <p className="text-sm text-muted">موردی نیست.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recent_loans.map(l => (
                <div key={l.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-medium">{l.equipment}</div>
                    <div className="text-xs text-muted">{l.patient}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span className="badge badge-blue">{l.status}</span>
                    <div className="text-xs text-muted" style={{ marginTop: 2, direction: 'ltr' }}>{fmt(l.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="text-lg font-semibold">آخرین درخواست‌ها</h3>
            <Link to="/app/requests" className="text-sm">مشاهده همه ←</Link>
          </div>
          {data.recent_requests.length === 0 ? (
            <p className="text-sm text-muted">موردی نیست.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recent_requests.map(r => (
                <div key={r.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-medium">{r.patient}</div>
                    <div className="text-xs text-muted">{r.category} · {r.priority}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span className="badge badge-orange">{r.status}</span>
                    <div className="text-xs text-muted" style={{ marginTop: 2, direction: 'ltr' }}>{fmt(r.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
