interface Item {
  key: string
  label: string
  value: number
}

const PALETTE = [
  '#1B52C4', '#2EBF8F', '#5787ef', '#fd7e14',
  '#dc3545', '#17a2b8', '#6c757d', '#8fe7cc',
]

/** Donut chart with legend — pure SVG, no dependencies. */
export default function DonutChart({ data }: { data: Item[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) {
    return <p className="text-sm text-muted text-center" style={{ padding: 'var(--space-8)' }}>داده‌ای موجود نیست</p>
  }

  const radius = 60
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const segments = data.map((d, i) => {
    const fraction = d.value / total
    const dash = fraction * circumference
    const seg = {
      key: d.key,
      color: PALETTE[i % PALETTE.length],
      dasharray: `${dash} ${circumference - dash}`,
      dashoffset: -offset,
    }
    offset += dash
    return seg
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        <g transform="rotate(-90 80 80)">
          {segments.map(s => (
            <circle
              key={s.key}
              cx={80}
              cy={80}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </g>
        <text x={80} y={74} textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: 'var(--color-text-primary)' }}>
          {total.toLocaleString('fa-IR')}
        </text>
        <text x={80} y={96} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}>
          کل
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 140 }}>
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center gap-2">
            <span style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
            <span className="text-sm" style={{ flex: 1 }}>{d.label}</span>
            <span className="text-sm font-semibold">{d.value.toLocaleString('fa-IR')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
