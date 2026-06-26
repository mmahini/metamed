import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyOTP, requestOTP, ApiError } from '../auth/api'
import { useAuth } from '../auth/AuthContext'

interface LocationState {
  email: string
  otp_id: string
  expires_at: string
  is_new_user: boolean
  dev_code?: string
}

const CODE_LENGTH = 5

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const state = location.state as LocationState | null

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!state?.email) navigate('/auth/sign-in', { replace: true })
  }, [state, navigate])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const id = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [resendCountdown])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const code = digits.join('')

  function handleChange(idx: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = cleaned
    setDigits(next)
    if (cleaned && idx < CODE_LENGTH - 1) {
      refs.current[idx + 1]?.focus()
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]
      next[idx - 1] = ''
      setDigits(next)
      refs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    refs.current[focusIdx]?.focus()
  }

  async function handleVerify() {
    if (code.length < CODE_LENGTH || !state) return
    setError('')
    setLoading(true)
    try {
      const res = await verifyOTP(state.otp_id, code)
      login(res.access, res.refresh, res.user)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body?.detail ?? err.body?.code
        setError(typeof detail === 'string' ? detail : 'کد وارد شده نادرست است.')
      } else {
        setError('خطا در اتصال به سرور.')
      }
      setDigits(Array(CODE_LENGTH).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!state?.email || resendCountdown > 0) return
    setResendLoading(true)
    setError('')
    try {
      const res = await requestOTP(state.email)
      navigate('/auth/verify', {
        replace: true,
        state: {
          ...state,
          otp_id: res.otp_id,
          expires_at: res.expires_at,
          dev_code: res.dev_code,
        },
      })
      setDigits(Array(CODE_LENGTH).fill(''))
      setResendCountdown(60)
      refs.current[0]?.focus()
    } catch (err) {
      if (err instanceof ApiError) {
        setError((err.body?.detail as string) ?? 'خطا در ارسال مجدد.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  if (!state?.email) return null

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo-wrap">
            <img src="/logo.png" alt="متامد" />
            <span className="auth-brand-name">متامد</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-1)' }}>
              تأیید ایمیل
            </h1>
            <p className="text-muted text-sm">
              کد ۵ رقمی ارسال شده به{' '}
              <strong style={{ color: 'var(--color-text-primary)', direction: 'ltr', display: 'inline-block' }}>
                {state.email}
              </strong>{' '}
              را وارد کنید.
            </p>
          </div>

          {state.dev_code && (
            <div className="alert alert-info" style={{ fontFamily: 'monospace', letterSpacing: 4 }}>
              [DEV] کد: {state.dev_code}
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="otp-grid">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input${d ? ' filled' : ''}`}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading}
                  aria-label={`رقم ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleVerify}
              disabled={code.length < CODE_LENGTH || loading}
            >
              {loading ? <span className="spinner" /> : 'تأیید و ورود'}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/auth/sign-in" className="text-muted">
              ← تغییر ایمیل
            </Link>

            {resendCountdown > 0 ? (
              <span className="text-muted">
                ارسال مجدد: {resendCountdown} ثانیه
              </span>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? <span className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> : 'ارسال مجدد کد'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="auth-aside">
        <img src="/logo.png" alt="متامد" style={{ height: 100, width: 'auto', opacity: 0.9 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-4)' }}>
            متامد
          </p>
          <p style={{ opacity: 0.85, lineHeight: 'var(--leading-loose)', maxWidth: 320 }}>
            سامانه ملی مدیریت تجهیزات امانی مراقبتی درمانی — یکپارچه، ایمن و دقیق
          </p>
        </div>
      </div>
    </div>
  )
}
