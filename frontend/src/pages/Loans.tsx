import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Loan {
  id: number
  equipment: number
  equipment_code: string
  equipment_name: string
  patient: number
  patient_name: string
  borrower_name: string
  status: string
  status_display: string
  is_overdue: boolean
  delivered_at: string | null
  due_date: string | null
  returned_at: string | null
}

interface Patient { id: number; full_name: string }
interface Equipment { id: number; code: string; name: string; status: string }
interface Unit { id: number; name: string; branch_name: string }

const STATUS_BADGE: Record<string, string> = {
  assigned: 'badge-blue',
  delivered: 'badge-orange',
  returned: 'badge-blue',
  disinfected: 'badge-blue',
  closed: 'badge-green',
  overdue: 'badge-red',
}

const STATUS_FILTERS = [
  { value: '', label: 'همه' },
  { value: 'assigned', label: 'تخصیص یافته' },
  { value: 'delivered', label: 'تحویل شده' },
  { value: 'returned', label: 'بازگشتی' },
  { value: 'closed', label: 'بسته شده' },
]

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fa-IR') : '—'
}

export default function Loans() {
  const [items, setItems] = useState<Loan[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [form, setForm] = useState({ equipment: '', patient: '', unit: '', notes: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      setItems(await apiFetch<Loan[]>(`loans/?${params}`))
    } catch {
      setError('خطا در دریافت امانت‌ها')
    } finally {
      setLoading(false)
    }
  }

  async function loadRefs() {
    try {
      const [p, e, u] = await Promise.all([
        apiFetch<Patient[]>('patients/?is_active=true'),
        apiFetch<Equipment[]>('equipment/?status=ready'),
        apiFetch<Unit[]>('org/units/?is_active=true'),
      ])
      setPatients(p)
      setEquipment(e)
      setUnits(u)
    } catch { /* non-blocking */ }
  }

  useEffect(() => { load() }, [statusFilter])
  useEffect(() => { loadRefs() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('loans/', {
        method: 'POST',
        body: JSON.stringify({
          equipment: Number(form.equipment),
          patient: Number(form.patient),
          unit: form.unit ? Number(form.unit) : null,
          notes: form.notes,
        }),
      })
      setShowForm(false)
      setForm({ equipment: '', patient: '', unit: '', notes: '' })
      load()
      loadRefs()
    } catch {
      setError('خطا در ثبت امانت')
    } finally {
      setSaving(false)
    }
  }

  async function deliver(id: number) {
    const due = prompt('موعد بازگشت (مثال: 2026-09-01) — خالی برای بدون موعد:')
    if (due === null) return
    setBusy(id)
    try {
      await apiFetch(`loans/${id}/deliver/`, {
        method: 'POST',
        body: JSON.stringify(due ? { due_date: due } : {}),
      })
      load()
    } catch {
      setError('خطا در تحویل')
    } finally {
      setBusy(null)
    }
  }

  async function simpleAction(id: number, action: 'return' | 'close') {
    setBusy(id)
    try {
      await apiFetch(`loans/${id}/${action}/`, { method: 'POST' })
      load()
    } catch {
      setError('خطا در انجام عملیات')
    } finally {
      setBusy(null)
    }
  }

  async function extend(id: number) {
    const due = prompt('موعد جدید (مثال: 2026-10-01):')
    if (!due) return
    setBusy(id)
    try {
      await apiFetch(`loans/${id}/extend/`, { method: 'POST', body: JSON.stringify({ due_date: due }) })
      load()
    } catch {
      setError('خطا در تمدید')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">امانت‌ها</h2>
          <p className="text-muted text-sm">مدیریت چرخه امانت تجهیزات</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ امانت جدید</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت امانت جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">تجهیز (آماده خدمت)</label>
              <select className="form-input" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب تجهیز…</option>
                {equipment.map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">بیمار</label>
              <select className="form-input" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب بیمار…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
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
                {saving ? <span className="spinner" /> : 'ثبت امانت'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </form>
          {equipment.length === 0 && (
            <p className="text-sm text-muted" style={{ marginTop: 'var(--space-3)' }}>
              ⚠️ تجهیز آماده خدمتی وجود ندارد. ابتدا تجهیزی با وضعیت «آماده خدمت» ثبت کنید.
            </p>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
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
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📦</div>
          <p>امانتی یافت نشد.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['تجهیز', 'بیمار', 'وضعیت', 'موعد بازگشت', 'عملیات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: 'var(--font-medium)' }}>{l.equipment_name}</div>
                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{l.equipment_code}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{l.patient_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${l.is_overdue ? 'badge-red' : (STATUS_BADGE[l.status] ?? 'badge-gray')}`}>
                      {l.is_overdue ? 'معوق' : l.status_display}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: l.is_overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{fmt(l.due_date)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {l.status === 'assigned' && (
                        <button className="btn btn-accent btn-sm" onClick={() => deliver(l.id)} disabled={busy === l.id}>تحویل</button>
                      )}
                      {(l.status === 'delivered' || l.status === 'overdue') && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => simpleAction(l.id, 'return')} disabled={busy === l.id}>بازگشت</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => extend(l.id)} disabled={busy === l.id}>تمدید</button>
                        </>
                      )}
                      {(l.status === 'returned' || l.status === 'disinfected') && (
                        <button className="btn btn-accent btn-sm" onClick={() => simpleAction(l.id, 'close')} disabled={busy === l.id}>بستن (آماده خدمت)</button>
                      )}
                      {l.status === 'closed' && <span className="text-xs text-muted">—</span>}
                    </div>
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
