import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Unit {
  id: number
  name: string
  code: string
  branch: number
  branch_name: string
  branch_city: string
  phone: string
  is_active: boolean
}

interface Branch {
  id: number
  name: string
  city: string
}

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', branch: '', phone: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [u, b] = await Promise.all([
        apiFetch<Unit[]>('org/units/'),
        apiFetch<Branch[]>('org/branches/?is_active=true'),
      ])
      setUnits(u)
      setBranches(b)
    } catch {
      setError('خطا در دریافت اطلاعات واحدها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('org/units/', { method: 'POST', body: JSON.stringify({ ...form, branch: Number(form.branch) }) })
      setShowForm(false)
      setForm({ name: '', code: '', branch: '', phone: '' })
      load()
    } catch {
      setError('خطا در ثبت واحد')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">واحدها</h2>
          <p className="text-muted text-sm">واحدهای خدمت‌رسان زیرمجموعه شعبه‌ها</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + افزودن واحد
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>افزودن واحد جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام واحد</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">کد</label>
              <input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">شعبه</label>
              <select className="form-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب شعبه…</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">تلفن</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : 'ثبت واحد'}
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
      ) : units.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🏪</div>
          <p>هنوز واحدی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['کد', 'نام واحد', 'شعبه', 'تلفن', 'وضعیت'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < units.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-primary-600)' }}>{u.code}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{u.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{u.branch_name} ({u.branch_city})</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', direction: 'ltr', textAlign: 'left' }}>{u.phone || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {u.is_active ? 'فعال' : 'غیرفعال'}
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
