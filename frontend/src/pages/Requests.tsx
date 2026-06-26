import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Request {
  id: number
  patient: number
  patient_name: string
  category: string
  category_display: string
  description: string
  priority: string
  priority_display: string
  status: string
  status_display: string
  unit_name: string
  created_at: string
}

interface Patient { id: number; full_name: string }
interface Unit { id: number; name: string; branch_name: string }

const CATEGORIES = [
  { value: 'mobility', label: 'حرکتی' },
  { value: 'respiratory', label: 'تنفسی' },
  { value: 'bed_care', label: 'بستری' },
  { value: 'rehabilitation', label: 'توانبخشی' },
  { value: 'monitoring', label: 'پایش' },
  { value: 'other', label: 'سایر' },
]

const PRIORITIES = [
  { value: 'low', label: 'عادی' },
  { value: 'normal', label: 'متوسط' },
  { value: 'high', label: 'بالا' },
  { value: 'urgent', label: 'اضطراری' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-orange',
  approved: 'badge-blue',
  fulfilled: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-gray',
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-gray',
  normal: 'badge-blue',
  high: 'badge-orange',
  urgent: 'badge-red',
}

const STATUS_FILTERS = [
  { value: '', label: 'همه' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'approved', label: 'تأیید شده' },
  { value: 'fulfilled', label: 'تأمین شده' },
]

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR')
}

export default function Requests() {
  const [items, setItems] = useState<Request[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [form, setForm] = useState({ patient: '', category: 'mobility', priority: 'normal', description: '', unit: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      setItems(await apiFetch<Request[]>(`requests/?${params}`))
    } catch {
      setError('خطا در دریافت درخواست‌ها')
    } finally {
      setLoading(false)
    }
  }

  async function loadRefs() {
    try {
      const [p, u] = await Promise.all([
        apiFetch<Patient[]>('patients/?is_active=true'),
        apiFetch<Unit[]>('org/units/?is_active=true'),
      ])
      setPatients(p)
      setUnits(u)
    } catch { /* non-blocking */ }
  }

  useEffect(() => { load() }, [statusFilter])
  useEffect(() => { loadRefs() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('requests/', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          patient: Number(form.patient),
          unit: form.unit ? Number(form.unit) : null,
        }),
      })
      setShowForm(false)
      setForm({ patient: '', category: 'mobility', priority: 'normal', description: '', unit: '' })
      load()
    } catch {
      setError('خطا در ثبت درخواست')
    } finally {
      setSaving(false)
    }
  }

  async function act(id: number, action: 'approve' | 'reject') {
    setBusy(id)
    try {
      await apiFetch(`requests/${id}/${action}/`, { method: 'POST' })
      load()
    } catch {
      setError('خطا در انجام عملیات')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">درخواست‌های تجهیزات</h2>
          <p className="text-muted text-sm">درخواست‌های بیماران برای دریافت تجهیزات</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ درخواست جدید</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت درخواست جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">بیمار</label>
              <select className="form-input" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب بیمار…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">دسته‌بندی موردنیاز</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ direction: 'rtl' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">اولویت</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ direction: 'rtl' }}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">واحد</label>
              <select className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ direction: 'rtl' }}>
                <option value="">بدون واحد</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} — {u.branch_name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">توضیحات</label>
              <textarea className="form-input" style={{ direction: 'rtl', textAlign: 'right', minHeight: 70 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : 'ثبت درخواست'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              className={`btn btn-sm ${statusFilter === s.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📋</div>
          <p>درخواستی یافت نشد.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['بیمار', 'دسته‌بندی', 'اولویت', 'وضعیت', 'تاریخ', 'عملیات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{r.patient_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{r.category_display}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${PRIORITY_BADGE[r.priority] ?? 'badge-gray'}`}>{r.priority_display}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-gray'}`}>{r.status_display}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{fmt(r.created_at)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button className="btn btn-accent btn-sm" onClick={() => act(r.id, 'approve')} disabled={busy === r.id}>تأیید</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => act(r.id, 'reject')} disabled={busy === r.id}>رد</button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
