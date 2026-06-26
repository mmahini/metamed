import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Branch {
  id: number
  name: string
  code: string
  city: string
  province: string
  phone: string
  is_active: boolean
  unit_count: number
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', city: '', province: '', phone: '', organization: 1 })
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await apiFetch<Branch[]>('org/branches/')
      setBranches(data)
    } catch {
      setError('خطا در دریافت اطلاعات شعبه‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('org/branches/', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ name: '', code: '', city: '', province: '', phone: '', organization: 1 })
      load()
    } catch {
      setError('خطا در ثبت شعبه')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">شعبه‌ها</h2>
          <p className="text-muted text-sm">مدیریت شعبه‌های استانی متامد</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + افزودن شعبه
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>افزودن شعبه جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام شعبه</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">کد</label>
              <input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">استان</label>
              <input className="form-input" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">شهر</label>
              <input className="form-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">تلفن</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : 'ثبت شعبه'}
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
      ) : branches.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🏢</div>
          <p>هنوز شعبه‌ای ثبت نشده است.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['کد', 'نام شعبه', 'استان / شهر', 'تلفن', 'واحدهای فعال', 'وضعیت'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: i < branches.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-primary-600)' }}>{b.code}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{b.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{b.province} / {b.city}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', direction: 'ltr', textAlign: 'left' }}>{b.phone || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{b.unit_count}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {b.is_active ? 'فعال' : 'غیرفعال'}
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
