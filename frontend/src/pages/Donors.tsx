import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Donor {
  id: number
  name: string
  type: string
  type_display: string
  phone: string
  email: string
  anonymous: boolean
  total_cash: number
  donation_count: number
}

interface CashDonation {
  id: number
  donor_name: string
  amount: number
  method_display: string
  purpose: string
  donated_at: string | null
  created_at: string
}

interface Stats {
  donor_count: number
  volunteer_count: number
  total_cash: number
  cash_donation_count: number
  equipment_donation_count: number
}

const METHODS = [
  { value: 'cash', label: 'نقدی' },
  { value: 'card', label: 'کارت‌خوان' },
  { value: 'transfer', label: 'انتقال بانکی' },
  { value: 'online', label: 'درگاه آنلاین' },
]

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fa-IR') : '—'
}

export default function Donors() {
  const [tab, setTab] = useState<'donors' | 'cash'>('donors')
  const [donors, setDonors] = useState<Donor[]>([])
  const [cash, setCash] = useState<CashDonation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDonorForm, setShowDonorForm] = useState(false)
  const [showCashForm, setShowCashForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [donorForm, setDonorForm] = useState({ name: '', type: 'individual', phone: '', email: '', anonymous: false })
  const [cashForm, setCashForm] = useState({ donor: '', amount: '', method: 'cash', purpose: '' })

  async function load() {
    setLoading(true)
    try {
      const [d, c, s] = await Promise.all([
        apiFetch<Donor[]>('donors/'),
        apiFetch<CashDonation[]>('cash-donations/'),
        apiFetch<Stats>('community-stats/'),
      ])
      setDonors(d)
      setCash(c)
      setStats(s)
    } catch {
      setError('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createDonor(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('donors/', { method: 'POST', body: JSON.stringify(donorForm) })
      setShowDonorForm(false)
      setDonorForm({ name: '', type: 'individual', phone: '', email: '', anonymous: false })
      load()
    } catch {
      setError('خطا در ثبت خیر')
    } finally {
      setSaving(false)
    }
  }

  async function createCash(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('cash-donations/', {
        method: 'POST',
        body: JSON.stringify({
          ...cashForm,
          donor: cashForm.donor ? Number(cashForm.donor) : null,
          amount: Number(cashForm.amount),
        }),
      })
      setShowCashForm(false)
      setCashForm({ donor: '', amount: '', method: 'cash', purpose: '' })
      load()
    } catch {
      setError('خطا در ثبت اهدا')
    } finally {
      setSaving(false)
    }
  }

  const STAT_CARDS = stats ? [
    { label: 'خیرین', value: stats.donor_count },
    { label: 'مجموع نقدی (ریال)', value: stats.total_cash },
    { label: 'اهدای نقدی', value: stats.cash_donation_count },
    { label: 'داوطلبان فعال', value: stats.volunteer_count },
  ] : []

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">خیرین و کمک‌ها</h2>
          <p className="text-muted text-sm">مدیریت خیرین و اهدای‌های نقدی</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowCashForm(true)}>+ اهدای نقدی</button>
          <button className="btn btn-primary" onClick={() => setShowDonorForm(true)}>+ خیر جدید</button>
        </div>
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

      {showDonorForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت خیر جدید</h3>
          <form onSubmit={createDonor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">نام خیر</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={donorForm.name} onChange={e => setDonorForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">نوع</label>
              <select className="form-input" value={donorForm.type} onChange={e => setDonorForm(f => ({ ...f, type: e.target.value }))} style={{ direction: 'rtl' }}>
                <option value="individual">حقیقی</option>
                <option value="organization">حقوقی</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">تلفن</label>
              <input className="form-input" value={donorForm.phone} onChange={e => setDonorForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">ایمیل</label>
              <input className="form-input" value={donorForm.email} onChange={e => setDonorForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input type="checkbox" id="anon" checked={donorForm.anonymous} onChange={e => setDonorForm(f => ({ ...f, anonymous: e.target.checked }))} />
              <label htmlFor="anon" className="form-label" style={{ margin: 0 }}>خیر ناشناس</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'ثبت'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDonorForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {showCashForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت اهدای نقدی</h3>
          <form onSubmit={createCash} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">خیر</label>
              <select className="form-input" value={cashForm.donor} onChange={e => setCashForm(f => ({ ...f, donor: e.target.value }))} style={{ direction: 'rtl' }}>
                <option value="">ناشناس</option>
                {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">مبلغ (ریال)</label>
              <input className="form-input" type="number" value={cashForm.amount} onChange={e => setCashForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">روش پرداخت</label>
              <select className="form-input" value={cashForm.method} onChange={e => setCashForm(f => ({ ...f, method: e.target.value }))} style={{ direction: 'rtl' }}>
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">بابت</label>
              <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={cashForm.purpose} onChange={e => setCashForm(f => ({ ...f, purpose: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'ثبت اهدا'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCashForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${tab === 'donors' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('donors')}>خیرین</button>
          <button className={`btn btn-sm ${tab === 'cash' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('cash')}>اهدای نقدی</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : tab === 'donors' ? (
        donors.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🤝</div>
            <p>هنوز خیری ثبت نشده است.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                  {['نام', 'نوع', 'تلفن', 'مجموع نقدی', 'تعداد کمک', ''].map((h, i) => (
                    <th key={i} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donors.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: i < donors.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{d.anonymous ? 'ناشناس' : d.name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span className="badge badge-blue">{d.type_display}</span></td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{d.phone || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{d.total_cash.toLocaleString('fa-IR')}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>{d.donation_count}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        cash.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>💰</div>
            <p>اهدای نقدی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                  {['خیر', 'مبلغ', 'روش', 'بابت', 'تاریخ'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cash.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < cash.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-medium)' }}>{c.donor_name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-accent-500)', fontWeight: 'var(--font-semibold)' }}>{c.amount.toLocaleString('fa-IR')}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span className="badge badge-gray">{c.method_display}</span></td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{c.purpose || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{fmt(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
