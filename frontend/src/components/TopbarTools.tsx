import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../auth/api'

interface SearchResult {
  type: string
  type_label: string
  id: number
  title: string
  subtitle: string
  link: string
}

export default function TopbarTools() {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  async function loadUnread() {
    try {
      const d = await apiFetch<{ count: number }>('notifications/unread-count/')
      setUnread(d.count)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadUnread()
    const id = setInterval(loadUnread, 60000)
    return () => clearInterval(id)
  }, [])

  // debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const id = setTimeout(async () => {
      try {
        const d = await apiFetch<{ results: SearchResult[] }>(`search/?q=${encodeURIComponent(q.trim())}`)
        setResults(d.results)
        setShowResults(true)
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(id)
  }, [q])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function go(r: SearchResult) {
    setShowResults(false)
    setQ('')
    navigate(r.link)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Search */}
      <div ref={boxRef} style={{ position: 'relative' }}>
        <input
          className="form-input"
          placeholder="جستجو…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length && setShowResults(true)}
          style={{ width: 220, padding: 'var(--space-2) var(--space-3)', direction: 'rtl', textAlign: 'right' }}
        />
        {showResults && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, width: 300,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 200,
              maxHeight: 360, overflowY: 'auto',
            }}
          >
            {results.length === 0 ? (
              <div className="text-sm text-muted" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>نتیجه‌ای یافت نشد</div>
            ) : (
              results.map(r => (
                <div
                  key={`${r.type}-${r.id}`}
                  onClick={() => go(r)}
                  style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-neutral-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span className="badge badge-gray" style={{ flexShrink: 0 }}>{r.type_label}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-sm font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    {r.subtitle && <div className="text-xs text-muted">{r.subtitle}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Notification bell */}
      <button
        onClick={() => navigate('/app/notifications')}
        title="اعلان‌ها"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: 'absolute', top: -2, insetInlineEnd: -2,
              background: 'var(--color-danger)', color: 'white',
              borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
              minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR')}
          </span>
        )}
      </button>
    </div>
  )
}
