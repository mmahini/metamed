import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../auth/api'

interface Transfer {
  id: number
  equipment: number
  equipment_code: string
  equipment_name: string
  from_unit_name: string
  to_unit_name: string
  status: string
  status_display: string
  reason: string
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-orange',
  in_transit: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-gray',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR')
}

export default function Transfers() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      setItems(await apiFetch<Transfer[]>('transfers/'))
    } catch {
      setError('خطا در دریافت انتقال‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function act(id: number, action: 'complete' | 'cancel') {
    setBusy(id)
    try {
      await apiFetch(`transfers/${id}/${action}/`, { method: 'POST' })
      load()
    } catch {
      setError('خطا در انجام عملیات')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="text-2xl font-bold">انتقال‌های تجهیزات</h2>
        <p className="text-muted text-sm">جابجایی تجهیزات بین واحدها</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🔁</div>
          <p>هیچ انتقالی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                {['تجهیز', 'از واحد', 'به واحد', 'وضعیت', 'تاریخ', 'عملیات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      onClick={() => navigate(`/app/equipment/${t.equipment}`)}
                      style={{ color: 'var(--color-primary-600)', cursor: 'pointer', fontWeight: 'var(--font-medium)' }}
                    >
                      {t.equipment_name}
                    </span>
                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{t.equipment_code}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{t.from_unit_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{t.to_unit_name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className={`badge ${STATUS_BADGE[t.status] ?? 'badge-gray'}`}>{t.status_display}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{fmt(t.created_at)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {(t.status === 'pending' || t.status === 'in_transit') ? (
                      <div className="flex gap-2">
                        <button className="btn btn-accent btn-sm" onClick={() => act(t.id, 'complete')} disabled={busy === t.id}>تکمیل</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => act(t.id, 'cancel')} disabled={busy === t.id}>لغو</button>
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
