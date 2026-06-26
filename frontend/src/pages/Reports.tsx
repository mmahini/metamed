import { useState } from 'react'
import { apiDownload } from '../auth/api'

const EXPORTS = [
  { key: 'equipment', label: 'فهرست تجهیزات', desc: 'کد، نام، دسته‌بندی، وضعیت، واحد و شعبه', path: 'reports/equipment.csv', file: 'equipment.csv', icon: '🏥' },
  { key: 'loans', label: 'امانت‌ها', desc: 'تجهیز، بیمار، وضعیت و تاریخ‌های تحویل/بازگشت', path: 'reports/loans.csv', file: 'loans.csv', icon: '📋' },
  { key: 'cash', label: 'کمک‌های نقدی', desc: 'خیر، مبلغ، روش پرداخت و تاریخ', path: 'reports/cash-donations.csv', file: 'cash_donations.csv', icon: '💰' },
]

export default function Reports() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function download(item: typeof EXPORTS[number]) {
    setBusy(item.key)
    setError('')
    try {
      await apiDownload(item.path, item.file)
    } catch {
      setError('خطا در دریافت فایل')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="text-2xl font-bold">گزارش‌ها و خروجی</h2>
        <p className="text-muted text-sm">دریافت خروجی CSV (سازگار با Excel)</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {EXPORTS.map(item => (
          <div key={item.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ fontSize: 32 }}>{item.icon}</div>
            <div>
              <h3 className="text-lg font-semibold">{item.label}</h3>
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>{item.desc}</p>
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => download(item)} disabled={busy === item.key}>
              {busy === item.key ? <span className="spinner" /> : '⬇ دریافت CSV'}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-2)' }}>مستندات API</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
          مستندات کامل و تعاملی API در آدرس زیر در دسترس است:
        </p>
        <a href="/api/docs/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
          باز کردن Swagger UI ↗
        </a>
      </div>
    </div>
  )
}
