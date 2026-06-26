import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Patient {
  id: number
  full_name: string
  national_id: string
  phone: string
  unit_name: string
  need_description: string
  is_active: boolean
  created_at: string
}

interface Unit {
  id: number
  name: string
  branch_name: string
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    full_name: '', national_id: '', phone: '', address: '',
    disease_description: '', need_description: '', referral_source: '', unit: '',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const [p, u] = await Promise.all([
        apiFetch<Patient[]>(`patients/?${params}`),
        apiFetch<Unit[]>('org/units/?is_active=true'),
      ])
      setPatients(p)
      setUnits(u)
    } catch {
      setError('خطا در دریافت اطلاعات بیماران')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [q])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('patients/', {
        method: 'POST',
        body: JSON.stringify({ ...form, unit: form.unit ? Number(form.unit) : null }),
      })
      setShowForm(false)
      setForm({ full_name: '', national_id: '', phone: '', address: '', disease_description: '', need_description: '', referral_source: '', unit: '' })
      load()
    } catch {
      setError('خطا در ثبت بیمار')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fa-IR')
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">بیماران</h2>
          <p className="text-muted text-sm">فهرست بیماران و نیازمندان تجهیزات</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + ثبت بیمار جدید
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Search */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <input
          className="form-input"
          placeholder="جستجو بر اساس نام…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 360, direction: 'rtl', textAlign: 'right' }}
        />
      </div>

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت بیمار جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام و نام خانوادگی</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">کد ملی</label>
              <input className="form-input" value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">تلفن</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">واحد</label>
              <select className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ direction: 'rtl' }}>
                <option value="">بدون واحد</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} — {u.branch_name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">توضیح نیاز</label>
              <textarea className="form-input" style={{ direction: 'rtl', textAlign: 'right', minHeight: 80 }} value={form.need_description} onChange={e => setForm(f => ({ ...f, need_description: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">مرجع معرفی</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.referral_source} onChange={e => setForm(f => ({ ...f, referral_source: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : 'ثبت بیمار'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : patients.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>👤</div>
          <p>{q ? 'نتیجه‌ای یافت نشد.' : 'هنوز بیماری ثبت نشده است.'}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['نام', 'کد ملی', 'تلفن', 'واحد', 'نیاز', 'تاریخ ثبت', 'وضعیت'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < patients.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{p.full_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>{p.national_id || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', direction: 'ltr', textAlign: 'left' }}>{p.phone || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{p.unit_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                    {p.need_description || '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{formatDate(p.created_at)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {p.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
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
