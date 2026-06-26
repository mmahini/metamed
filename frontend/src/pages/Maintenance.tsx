import { useEffect, useState } from 'react'
import { apiFetch } from '../auth/api'

interface Repair {
  id: number
  equipment: number
  equipment_code: string
  equipment_name: string
  status: string
  status_display: string
  description: string
  technician_email: string
  supplier_name: string
  cost: number | null
  started_at: string | null
  completed_at: string | null
}

interface Damage {
  id: number
  equipment: number
  equipment_code: string
  equipment_name: string
  severity: string
  severity_display: string
  description: string
  resolved: boolean
  created_at: string
}

interface Stats {
  open: number
  in_progress: number
  awaiting_parts: number
  completed: number
  unresolved_damage: number
  total_cost: number
}

interface Equipment { id: number; code: string; name: string }

const REPAIR_BADGE: Record<string, string> = {
  open: 'badge-orange',
  in_progress: 'badge-blue',
  awaiting_parts: 'badge-red',
  completed: 'badge-green',
  decommissioned: 'badge-gray',
}

const SEVERITY_BADGE: Record<string, string> = {
  minor: 'badge-gray',
  moderate: 'badge-orange',
  major: 'badge-red',
  irreparable: 'badge-red',
}

const SEVERITIES = [
  { value: 'minor', label: 'جزئی' },
  { value: 'moderate', label: 'متوسط' },
  { value: 'major', label: 'شدید' },
  { value: 'irreparable', label: 'غیرقابل تعمیر' },
]

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fa-IR') : '—'
}

export default function Maintenance() {
  const [tab, setTab] = useState<'repairs' | 'damage'>('repairs')
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [damages, setDamages] = useState<Damage[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [showDamageForm, setShowDamageForm] = useState(false)
  const [showRepairForm, setShowRepairForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [damageForm, setDamageForm] = useState({ equipment: '', severity: 'minor', description: '' })
  const [repairForm, setRepairForm] = useState({ equipment: '', description: '', cost: '' })

  async function load() {
    setLoading(true)
    try {
      const [r, d, s] = await Promise.all([
        apiFetch<Repair[]>('maintenances/'),
        apiFetch<Damage[]>('damage-reports/'),
        apiFetch<Stats>('maintenance-stats/'),
      ])
      setRepairs(r)
      setDamages(d)
      setStats(s)
    } catch {
      setError('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  async function loadEquipment() {
    try {
      setEquipment(await apiFetch<Equipment[]>('equipment/'))
    } catch { /* non-blocking */ }
  }

  useEffect(() => { load(); loadEquipment() }, [])

  async function createDamage(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('damage-reports/', {
        method: 'POST',
        body: JSON.stringify({ ...damageForm, equipment: Number(damageForm.equipment) }),
      })
      setShowDamageForm(false)
      setDamageForm({ equipment: '', severity: 'minor', description: '' })
      load()
    } catch {
      setError('خطا در ثبت گزارش آسیب')
    } finally {
      setSaving(false)
    }
  }

  async function createRepair(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('maintenances/', {
        method: 'POST',
        body: JSON.stringify({
          equipment: Number(repairForm.equipment),
          description: repairForm.description,
          cost: repairForm.cost ? Number(repairForm.cost) : null,
        }),
      })
      setShowRepairForm(false)
      setRepairForm({ equipment: '', description: '', cost: '' })
      load()
    } catch {
      setError('خطا در ثبت تعمیر')
    } finally {
      setSaving(false)
    }
  }

  async function repairAction(id: number, action: 'start' | 'await-parts' | 'complete') {
    setBusy(id)
    try {
      await apiFetch(`maintenances/${id}/${action}/`, { method: 'POST' })
      load()
    } catch {
      setError('خطا در انجام عملیات')
    } finally {
      setBusy(null)
    }
  }

  async function decommission(id: number) {
    const reason = prompt('دلیل اسقاط:')
    if (reason === null) return
    setBusy(id)
    try {
      await apiFetch(`maintenances/${id}/decommission/`, { method: 'POST', body: JSON.stringify({ reason }) })
      load()
    } catch {
      setError('خطا در اسقاط')
    } finally {
      setBusy(null)
    }
  }

  const STAT_CARDS = stats ? [
    { label: 'تعمیرات باز', value: stats.open },
    { label: 'در حال تعمیر', value: stats.in_progress },
    { label: 'در انتظار قطعه', value: stats.awaiting_parts },
    { label: 'آسیب رسیدگی‌نشده', value: stats.unresolved_damage },
  ] : []

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="text-2xl font-bold">نگهداری و تعمیر</h2>
          <p className="text-muted text-sm">صف تعمیرات و گزارش‌های آسیب</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowDamageForm(true)}>+ گزارش آسیب</button>
          <button className="btn btn-primary" onClick={() => setShowRepairForm(true)}>+ ثبت تعمیر</button>
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

      {showDamageForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت گزارش آسیب</h3>
          <form onSubmit={createDamage} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">تجهیز</label>
              <select className="form-input" value={damageForm.equipment} onChange={e => setDamageForm(f => ({ ...f, equipment: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب تجهیز…</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.code} — {eq.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">شدت آسیب</label>
              <select className="form-input" value={damageForm.severity} onChange={e => setDamageForm(f => ({ ...f, severity: e.target.value }))} style={{ direction: 'rtl' }}>
                {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">شرح آسیب</label>
              <textarea className="form-input" style={{ direction: 'rtl', textAlign: 'right', minHeight: 70 }} value={damageForm.description} onChange={e => setDamageForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'ثبت گزارش'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDamageForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {showRepairForm && (
        <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت تعمیر</h3>
          <form onSubmit={createRepair} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">تجهیز</label>
              <select className="form-input" value={repairForm.equipment} onChange={e => setRepairForm(f => ({ ...f, equipment: e.target.value }))} required style={{ direction: 'rtl' }}>
                <option value="">انتخاب تجهیز…</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.code} — {eq.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">هزینه برآوردی (ریال)</label>
              <input className="form-input" type="number" value={repairForm.cost} onChange={e => setRepairForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">شرح کار</label>
              <textarea className="form-input" style={{ direction: 'rtl', textAlign: 'right', minHeight: 70 }} value={repairForm.description} onChange={e => setRepairForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'ثبت تعمیر'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowRepairForm(false)}>انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${tab === 'repairs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('repairs')}>صف تعمیرات</button>
          <button className={`btn btn-sm ${tab === 'damage' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('damage')}>گزارش‌های آسیب</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
          در حال بارگذاری…
        </div>
      ) : tab === 'repairs' ? (
        repairs.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🔧</div>
            <p>تعمیری ثبت نشده است.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                  {['تجهیز', 'وضعیت', 'تکنسین', 'هزینه', 'عملیات'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {repairs.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < repairs.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 'var(--font-medium)' }}>{r.equipment_name}</div>
                      <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{r.equipment_code}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span className={`badge ${REPAIR_BADGE[r.status] ?? 'badge-gray'}`}>{r.status_display}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{r.technician_email || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{r.cost ? r.cost.toLocaleString('fa-IR') : '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {r.status === 'open' && <button className="btn btn-accent btn-sm" onClick={() => repairAction(r.id, 'start')} disabled={busy === r.id}>شروع</button>}
                        {r.status === 'in_progress' && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => repairAction(r.id, 'await-parts')} disabled={busy === r.id}>انتظار قطعه</button>
                            <button className="btn btn-accent btn-sm" onClick={() => repairAction(r.id, 'complete')} disabled={busy === r.id}>تکمیل</button>
                          </>
                        )}
                        {r.status === 'awaiting_parts' && <button className="btn btn-accent btn-sm" onClick={() => repairAction(r.id, 'complete')} disabled={busy === r.id}>تکمیل</button>}
                        {(r.status === 'open' || r.status === 'in_progress' || r.status === 'awaiting_parts') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => decommission(r.id)} disabled={busy === r.id} style={{ color: 'var(--color-danger)' }}>اسقاط</button>
                        )}
                        {(r.status === 'completed' || r.status === 'decommissioned') && <span className="text-xs text-muted">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        damages.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>⚠️</div>
            <p>گزارش آسیبی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)' }}>
                  {['تجهیز', 'شدت', 'شرح', 'وضعیت', 'تاریخ'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {damages.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: i < damages.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 'var(--font-medium)' }}>{d.equipment_name}</div>
                      <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{d.equipment_code}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span className={`badge ${SEVERITY_BADGE[d.severity] ?? 'badge-gray'}`}>{d.severity_display}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 280, color: 'var(--color-text-secondary)' }}>{d.description}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span className={`badge ${d.resolved ? 'badge-green' : 'badge-orange'}`}>{d.resolved ? 'رسیدگی شده' : 'باز'}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', direction: 'ltr', textAlign: 'left' }}>{fmt(d.created_at)}</td>
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
