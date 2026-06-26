import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Volunteer {
  id: number
  full_name: string
  phone: string
  email: string
  skills: string
  availability: string
  is_active: boolean
}

export default function Volunteers() {
  const [items, setItems] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', skills: '', availability: '' })

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      setItems(await apiFetch<Volunteer[]>(`volunteers/?${params}`))
    } catch {
      setError('خطا در دریافت داوطلبان')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [q])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('volunteers/', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ full_name: '', phone: '', email: '', skills: '', availability: '' })
      load()
    } catch {
      setError('خطا در ثبت داوطلب')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">داوطلبان</h2>
          <p className="text-muted text-sm">مدیریت داوطلبان و مهارت‌ها</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ داوطلب جدید</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {showForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت داوطلب جدید</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام و نام خانوادگی</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">تلفن</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">ایمیل</label>
              <input className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">در دسترس بودن</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} placeholder="مثلاً پنجشنبه‌ها" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">مهارت‌ها</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="مثلاً تعمیرات، حمل‌ونقل، پذیرش" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'ثبت داوطلب'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <input className="form-input" placeholder="جستجو بر اساس نام…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 360, direction: 'rtl', textAlign: 'right' }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🙋</div>
          <p>{q ? 'نتیجه‌ای یافت نشد.' : 'هنوز داوطلبی ثبت نشده است.'}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['نام', 'تلفن', 'مهارت‌ها', 'در دسترس', 'وضعیت'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{v.full_name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{v.phone || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{v.skills || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{v.availability || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${v.is_active ? 'badge-green' : 'badge-gray'}`}>{v.is_active ? 'فعال' : 'غیرفعال'}</span>
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
