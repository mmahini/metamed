import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Equipment {
  id: number
  code: string
  name: string
  category_display: string
  status: string
  status_display: string
  unit_name: string
  branch_name: string
  acquisition_type_display: string
  is_active: boolean
}

const STATUS_BADGE: Record<string, string> = {
  ready: 'badge-green',
  reserved: 'badge-blue',
  on_loan: 'badge-orange',
  in_transfer: 'badge-blue',
  needs_review: 'badge-orange',
  needs_disinfection: 'badge-orange',
  under_repair: 'badge-red',
  awaiting_parts: 'badge-red',
  decommissioned: 'badge-gray',
  scrapped: 'badge-gray',
  lost: 'badge-red',
}

const CATEGORIES = [
  { value: '', label: 'همه دسته‌ها' },
  { value: 'mobility', label: 'حرکتی' },
  { value: 'respiratory', label: 'تنفسی' },
  { value: 'bed_care', label: 'بستری' },
  { value: 'rehabilitation', label: 'توانبخشی' },
  { value: 'monitoring', label: 'پایش' },
  { value: 'other', label: 'سایر' },
]

const STATUSES = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'ready', label: 'آماده خدمت' },
  { value: 'on_loan', label: 'امانت داده شده' },
  { value: 'under_repair', label: 'در تعمیر' },
  { value: 'decommissioned', label: 'خارج از خدمت' },
]

export default function EquipmentList() {
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const data = await apiFetch<Equipment[]>(`equipment/?${params}`)
      setItems(data)
    } catch {
      setError('خطا در دریافت تجهیزات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, categoryFilter])

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">تجهیزات</h2>
          <p className="text-muted text-sm">فهرست کلیه تجهیزات امانی</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: 160 }}>
            <label className="form-label">وضعیت</label>
            <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ direction: 'rtl' }}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: 160 }}>
            <label className="form-label">دسته‌بندی</label>
            <select className="form-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ direction: 'rtl' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🏥</div>
          <p>هیچ تجهیزی یافت نشد.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['کد', 'نام تجهیز', 'دسته‌بندی', 'وضعیت', 'واحد', 'شعبه', 'نوع تملک'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-primary-600)' }}>{e.code}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{e.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.category_display}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${STATUS_BADGE[e.status] ?? 'badge-gray'}`}>{e.status_display}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.unit_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.branch_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.acquisition_type_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
