import { Link } from 'react-router-dom'

const features = [
  {
    icon: '🏥',
    title: 'مدیریت تجهیزات',
    desc: 'ثبت، ردیابی و مدیریت کامل تجهیزات امانی درمانی در سراسر کشور',
  },
  {
    icon: '📋',
    title: 'فرآیند امانت',
    desc: 'درخواست، تحویل، ردیابی و بازگشت تجهیزات به صورت یکپارچه',
  },
  {
    icon: '🔧',
    title: 'نگهداری و تعمیر',
    desc: 'ثبت خرابی، پیگیری تعمیر و تاریخچه نگهداری هر دستگاه',
  },
  {
    icon: '📊',
    title: 'گزارش‌گیری پیشرفته',
    desc: 'داشبوردهای تحلیلی و گزارش‌های جامع برای مدیران استانی و ملی',
  },
  {
    icon: '🤝',
    title: 'مدیریت خیرین',
    desc: 'ثبت اهدا، مشارکت داوطلبان و ردیابی کمک‌های خیریه',
  },
  {
    icon: '🔐',
    title: 'کنترل دسترسی نقش‌محور',
    desc: '۹ نقش سازمانی با سطح دسترسی متناسب از مرکز ملی تا واحد',
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Nav */}
      <nav className="landing-nav">
        <div className="container landing-nav-inner">
          <Link to="/" className="landing-nav-logo">
            <img src="/logo.png" alt="متامد" />
            <span>متامد</span>
          </Link>
          <Link to="/auth/sign-in" className="btn btn-primary">
            ورود به سامانه
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="landing-hero-eyebrow">
            ✦ سامانه ملی مراقبتی درمانی
          </div>
          <h1>
            مرکز <span>تجهیزات امانی</span><br />مراقبتی درمانی
          </h1>
          <p>
            متامد یک سامانه جامع برای مدیریت هوشمند تجهیزات پزشکی امانتی در سراسر کشور است.
            از درخواست تا بازگشت، همه چیز در یک بستر یکپارچه.
          </p>
          <div className="landing-hero-actions">
            <Link to="/auth/sign-in" className="btn btn-primary btn-lg">
              ورود به سامانه
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              بیشتر بدانید
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-3)' }}>
              امکانات متامد
            </h2>
            <p className="text-muted text-lg">
              راهکار جامع مدیریت تجهیزات پزشکی امانتی برای سازمان‌های خیریه و بهداشتی
            </p>
          </div>

          <div className="landing-features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-accent-400) 100%)',
          padding: 'var(--space-20) 0',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div className="container">
          <h2 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-4)' }}>
            آماده شروع هستید؟
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', opacity: 0.9, marginBottom: 'var(--space-8)' }}>
            با ایمیل سازمانی خود وارد شوید و مدیریت هوشمند تجهیزات را تجربه کنید.
          </p>
          <Link
            to="/auth/sign-in"
            className="btn btn-lg"
            style={{ backgroundColor: 'white', color: 'var(--color-primary-600)' }}
          >
            ورود به سامانه
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>
            © {new Date().getFullYear()} <strong>متامد</strong> — مرکز تجهیزات امانی مراقبتی درمانی
          </p>
        </div>
      </footer>
    </div>
  )
}
