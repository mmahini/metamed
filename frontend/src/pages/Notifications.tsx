import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../auth/api'

interface Notification {
  id: number
  kind: string
  kind_display: string
  title: string
  body: string
  link: string
  read: boolean
  created_at: string
}

const KIND_BADGE: Record<string, string> = {
  request: 'badge-orange',
  loan: 'badge-blue',
  maintenance: 'badge-red',
  donation: 'badge-green',
  system: 'badge-gray',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fa-IR')
}

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setItems(await apiFetch<Notification[]>('notifications/'))
    } catch {
      setError('خطا در دریافت اعلان‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    await apiFetch('notifications/mark-all-read/', { method: 'POST' })
    load()
  }

  async function open(n: Notification) {
    if (!n.read) {
      await apiFetch(`notifications/${n.id}/mark-read/`, { method: 'POST' })
    }
    if (n.link) navigate(n.link)
    else load()
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">اعلان‌ها</h2>
          <p className="text-muted text-sm">رویدادها و یادآوری‌های سامانه</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={markAllRead}>علامت‌گذاری همه به‌عنوان خوانده‌شده</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🔔</div>
          <p>اعلانی وجود ندارد.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((n, i) => (
            <div
              key={n.id}
              onClick={() => open(n)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: n.read ? 'transparent' : 'var(--color-primary-50)',
                cursor: 'pointer',
              }}
            >
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-600)', marginTop: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                  <span className={`badge ${KIND_BADGE[n.kind] ?? 'badge-gray'}`}>{n.kind_display}</span>
                  <span className="text-sm font-semibold">{n.title}</span>
                </div>
                {n.body && <p className="text-sm text-muted">{n.body}</p>}
              </div>
              <span className="text-xs text-muted" style={{ direction: 'ltr', flexShrink: 0 }}>{fmt(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
