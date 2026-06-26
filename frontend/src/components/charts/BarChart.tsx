interface Item {
  key: string
  label: string
  value: number
}

const PALETTE = [
  '#1B52C4', '#2EBF8F', '#5787ef', '#fd7e14',
  '#dc3545', '#17a2b8', '#6c757d', '#8fe7cc',
  '#81a5f3', '#e65100', '#259e77',
]

/** Horizontal bar chart — RTL-friendly, pure SVG, no dependencies. */
export default function BarChart({ data }: { data: Item[] }) {
  if (!data.length) {
    return <p className="text-sm text-muted text-center" style={{ padding: 'var(--space-8)' }}>داده‌ای موجود نیست</p>
  }
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {data.map((d, i) => (
        <div key={d.key}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span className="text-sm">{d.label}</span>
            <span className="text-sm font-semibold">{d.value.toLocaleString('fa-IR')}</span>
          </div>
          <div style={{ height: 10, background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                height: '100%',
                background: PALETTE[i % PALETTE.length],
                borderRadius: 'var(--radius-full)',
                transition: 'width 400ms ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
