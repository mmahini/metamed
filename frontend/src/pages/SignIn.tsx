import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { requestOTP, ApiError } from '../auth/api'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestOTP(email.trim().toLowerCase())
      navigate('/auth/verify', {
        state: {
          email: email.trim().toLowerCase(),
          otp_id: res.otp_id,
          expires_at: res.expires_at,
          is_new_user: res.is_new_user,
          dev_code: res.dev_code,
        },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body?.detail ?? err.body?.email
        setError(typeof detail === 'string' ? detail : 'خطا در ارسال کد. لطفاً دوباره تلاش کنید.')
      } else {
        setError('خطا در اتصال به سرور.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Right panel (RTL: first column) */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo-wrap">
            <img src="/logo.png" alt="متامد" />
            <span className="auth-brand-name">متامد</span>
            <span className="auth-tagline">مرکز تجهیزات امانی مراقبتی درمانی</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-1)' }}>
              ورود به سامانه
            </h1>
            <p className="text-muted text-sm">
              ایمیل سازمانی خود را وارد کنید. کد تأیید برای شما ارسال می‌شود.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                آدرس ایمیل
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="example@org.ir"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !email.trim()}
            >
              {loading ? <span className="spinner" /> : 'ارسال کد تأیید'}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            با ورود، <Link to="/">قوانین استفاده</Link> از سامانه را می‌پذیرید.
          </p>
        </div>
      </div>

      {/* Left aside — decorative, hidden on mobile */}
      <div className="auth-aside">
        <img
          src="/logo.png"
          alt="متامد"
          style={{ height: 100, width: 'auto', opacity: 0.9 }}
        />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-extrabold)',
              marginBottom: 'var(--space-4)',
            }}
          >
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
