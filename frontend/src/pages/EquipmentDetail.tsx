import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../auth/api'
import { STATUS_BADGE } from './EquipmentList'

interface Equipment {
  id: number
  code: string
  serial_number: string
  name: string
  category_display: string
  status: string
  status_display: string
  unit: number | null
  unit_name: string
  branch_name: string
  supplier_name: string
  acquisition_type_display: string
  acquisition_date: string | null
  notes: string
  is_active: boolean
  created_at: string
}

interface HistoryItem {
  id: number
  old_status: string
  new_status: string
  changed_by_email: string
  changed_at: string
  notes: string
}

interface Inspection {
  id: number
  result: string
  result_display: string
  notes: string
  inspected_by_email: string
  inspected_at: string
}

interface Unit { id: number; name: string; branch_name: string }

const STATUS_OPTIONS = [
  ['ready', 'آماده خدمت'], ['reserved', 'رزرو شده'], ['on_loan', 'امانت داده شده'],
  ['needs_review', 'نیازمند بررسی'], ['needs_disinfection', 'نیازمند ضدعفونی'],
  ['under_repair', 'در حال تعمیر'], ['awaiting_parts', 'در انتظار قطعه'],
  ['decommissioned', 'خارج از خدمت'], ['scrapped', 'اسقاط شده'], ['lost', 'مفقود شده'],
]

const INSPECTION_RESULTS = [
  ['pass', 'سالم'], ['minor_issue', 'نقص جزئی'], ['needs_repair', 'نیازمند تعمیر'], ['fail', 'مردود'],
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fa-IR')
}

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [eq, setEq] = useState<Equipment | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [busy, setBusy] = useState(false)

  const [inspResult, setInspResult] = useState('pass')
  const [inspNote, setInspNote] = useState('')

  const [transferUnit, setTransferUnit] = useState('')
  const [transferReason, setTransferReason] = useState('')

  async function load() {
    try {
      const [e, h, insp, u] = await Promise.all([
        apiFetch<Equipment>(`equipment/${id}/`),
        apiFetch<HistoryItem[]>(`equipment/${id}/history/`),
        apiFetch<Inspection[]>(`equipment/${id}/inspections/`),
        apiFetch<Unit[]>('org/units/?is_active=true'),
      ])
      setEq(e)
      setHistory(h)
      setInspections(insp)
      setUnits(u)
      setNewStatus(e.status)
    } catch {
      setError('خطا در دریافت اطلاعات تجهیز')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function changeStatus() {
    setBusy(true)
    try {
      await apiFetch(`equipment/${id}/change-status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, notes: statusNote }),
      })
      setStatusNote('')
      load()
    } catch {
      setError('خطا در تغییر وضعیت')
    } finally {
      setBusy(false)
    }
  }

  async function addInspection() {
    setBusy(true)
    try {
      await apiFetch('inspections/', {
        method: 'POST',
        body: JSON.stringify({ equipment: Number(id), result: inspResult, notes: inspNote }),
      })
      setInspNote('')
      setInspResult('pass')
      load()
    } catch {
      setError('خطا در ثبت بازرسی')
    } finally {
      setBusy(false)
    }
  }

  async function createTransfer() {
    if (!transferUnit) return
    setBusy(true)
    try {
      await apiFetch('transfers/', {
        method: 'POST',
        body: JSON.stringify({ equipment: Number(id), to_unit: Number(transferUnit), reason: transferReason }),
      })
      setTransferUnit('')
      setTransferReason('')
      load()
    } catch {
      setError('خطا در ثبت انتقال')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
        <span className="spinner spinner-dark" style={{ width: 28, height: 28, marginLeft: 'var(--space-3)' }} />
        در حال بارگذاری…
      </div>
    )
  }

  if (!eq) {
    return <div className="alert alert-error">{error || 'تجهیز یافت نشد.'}</div>
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/equipment')} style={{ marginBottom: 'var(--space-4)' }}>
        ← بازگشت به فهرست
      </button>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Header */}
      <div className="card card-lg" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{eq.name}</h2>
              <span className={`badge ${STATUS_BADGE[eq.status] ?? 'badge-gray'}`}>{eq.status_display}</span>
            </div>
            <p className="text-muted text-sm" style={{ fontFamily: 'monospace', marginTop: 4 }}>{eq.code}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            ['دسته‌بندی', eq.category_display],
            ['سریال', eq.serial_number || '—'],
            ['نوع تملک', eq.acquisition_type_display],
            ['واحد', eq.unit_name || '—'],
            ['شعبه', eq.branch_name || '—'],
            ['تأمین‌کننده', eq.supplier_name || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>{label}</div>
              <div className="text-sm font-medium">{val}</div>
            </div>
          ))}
        </div>
        {eq.notes && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <div className="text-xs text-muted" style={{ marginBottom: 4 }}>توضیحات</div>
            <div className="text-sm">{eq.notes}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Status change */}
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>تغییر وضعیت</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">وضعیت جدید</label>
            <select className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ direction: 'rtl' }}>
              {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">یادداشت</label>
            <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={statusNote} onChange={e => setStatusNote(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={changeStatus} disabled={busy || newStatus === eq.status}>
            ثبت تغییر وضعیت
          </button>
        </div>

        {/* Transfer */}
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>انتقال به واحد دیگر</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">واحد مقصد</label>
            <select className="form-input" value={transferUnit} onChange={e => setTransferUnit(e.target.value)} style={{ direction: 'rtl' }}>
              <option value="">انتخاب واحد…</option>
              {units.filter(u => u.id !== eq.unit).map(u => <option key={u.id} value={u.id}>{u.name} — {u.branch_name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">دلیل انتقال</label>
            <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={transferReason} onChange={e => setTransferReason(e.target.value)} />
          </div>
          <button className="btn btn-accent btn-sm" onClick={createTransfer} disabled={busy || !transferUnit}>
            ثبت درخواست انتقال
          </button>
        </div>

        {/* Inspection */}
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>ثبت بازرسی</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">نتیجه</label>
            <select className="form-input" value={inspResult} onChange={e => setInspResult(e.target.value)} style={{ direction: 'rtl' }}>
              {INSPECTION_RESULTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">یادداشت</label>
            <input className="form-input" style={{ direction: 'rtl', textAlign: 'right' }} value={inspNote} onChange={e => setInspNote(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={addInspection} disabled={busy}>ثبت بازرسی</button>
        </div>

        {/* Inspection history */}
        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>سابقه بازرسی</h3>
          {inspections.length === 0 ? (
            <p className="text-sm text-muted">بازرسی‌ای ثبت نشده است.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {inspections.map(i => (
                <div key={i.id} style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="badge badge-blue">{i.result_display}</span>
                    <span className="text-xs text-muted" style={{ direction: 'ltr' }}>{fmt(i.inspected_at)}</span>
                  </div>
                  {i.notes && <p className="text-sm" style={{ marginTop: 4 }}>{i.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status history timeline */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>تاریخچه وضعیت</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted">تاریخچه‌ای ثبت نشده است.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['از وضعیت', 'به وضعیت', 'توسط', 'یادداشت', 'زمان'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-semibold)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{h.old_status || '—'}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--font-medium)' }}>{h.new_status}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', direction: 'ltr', textAlign: 'left', color: 'var(--color-text-secondary)' }}>{h.changed_by_email || '—'}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>{h.notes || '—'}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', direction: 'ltr', textAlign: 'left', color: 'var(--color-text-secondary)' }}>{fmt(h.changed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
