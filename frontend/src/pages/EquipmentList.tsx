import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface Stats {
  total: number
  ready: number
  on_loan: number
  under_repair: number
  pending_transfers: number
}

interface Unit {
  id: number
  name: string
  branch_name: string
}

export const STATUS_BADGE: Record<string, string> = {
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
  { value: 'mobility', label: 'حرکتی' },
  { value: 'respiratory', label: 'تنفسی' },
  { value: 'bed_care', label: 'بستری' },
  { value: 'rehabilitation', label: 'توانبخشی' },
  { value: 'monitoring', label: 'پایش' },
  { value: 'other', label: 'سایر' },
]

const ACQUISITION_TYPES = [
  { value: 'donated', label: 'اهدایی' },
  { value: 'purchased', label: 'خریداری شده' },
  { value: 'transferred', label: 'انتقالی' },
]

const STATUSES = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'ready', label: 'آماده خدمت' },
  { value: 'on_loan', label: 'امانت داده شده' },
  { value: 'under_repair', label: 'در تعمیر' },
  { value: 'decommissioned', label: 'خارج از خدمت' },
]

export default function EquipmentList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Equipment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'other', serial_number: '',
    acquisition_type: 'donated', unit: '', notes: '',
  })

  async function loadStats() {
    try {
      setStats(await apiFetch<Stats>('equipment-stats/'))
    } catch { /* non-blocking */ }
  }

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (q) params.set('q', q)
      const data = await apiFetch<Equipment[]>(`equipment/?${params}`)
      setItems(data)
    } catch {
      setError('خطا در دریافت تجهیزات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, categoryFilter, q])
  useEffect(() => { loadStats(); loadUnits() }, [])

  async function loadUnits() {
    try {
      setUnits(await apiFetch<Unit[]>('org/units/?is_active=true'))
    } catch { /* non-blocking */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('equipment/', {
        method: 'POST',
        body: JSON.stringify({ ...form, unit: form.unit ? Number(form.unit) : null }),
      })
      setShowForm(false)
      setForm({ name: '', category: 'other', serial_number: '', acquisition_type: 'donated', unit: '', notes: '' })
      load()
      loadStats()
    } catch {
      setError('خطا در ثبت تجهیز')
    } finally {
      setSaving(false)
    }
  }

  const STAT_CARDS = stats ? [
    { label: 'کل تجهیزات', value: stats.total },
    { label: 'آماده خدمت', value: stats.ready },
    { label: 'امانت داده شده', value: stats.on_loan },
    { label: 'در تعمیر', value: stats.under_repair },
    { label: 'انتقال در جریان', value: stats.pending_transfers },
  ] : []

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">تجهیزات</h2>
          <p className="text-muted text-sm">فهرست کلیه تجهیزات امانی</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ ثبت تجهیز</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {stats && (
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {STAT_CARDS.map(c => (
            <div key={c.label} className="kpi-card">
              <div className="kpi-label">{c.label}</div>
              <div className="kpi-value">{c.value.toLocaleString('fa-IR')}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت تجهیز جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام تجهیز</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">سریال</label>
              <input className="form-input" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">دسته‌بندی</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ direction: 'rtl' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">نوع تملک</label>
              <select className="form-input" value={form.acquisition_type} onChange={e => setForm(f => ({ ...f, acquisition_type: e.target.value }))} style={{ direction: 'rtl' }}>
                {ACQUISITION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">واحد</label>
              <select className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ direction: 'rtl' }}>
                <option value="">بدون واحد</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} — {u.branch_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">توضیحات</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : 'ثبت تجهیز'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: 200 }}>
            <label className="form-label">جستجو</label>
            <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} placeholder="نام تجهیز…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: 160 }}>
            <label className="form-label">وضعیت</label>
            <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ direction: 'rtl' }}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: 160 }}>
            <label className="form-label">دسته‌بندی</label>
            <select className="form-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ direction: 'rtl' }}>
              <option value="">همه دسته‌ها</option>
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
                {['کد', 'نام تجهیز', 'دسته‌بندی', 'وضعیت', 'واحد', 'شعبه'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((e, i) => (
                <tr
                  key={e.id}
                  onClick={() => navigate(`/app/equipment/${e.id}`)}
                  style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--color-neutral-50)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-primary-600)' }}>{e.code}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{e.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.category_display}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${STATUS_BADGE[e.status] ?? 'badge-gray'}`}>{e.status_display}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.unit_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{e.branch_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
