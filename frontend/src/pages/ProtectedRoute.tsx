import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 'var(--space-3)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
        <span>در حال بارگذاری…</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth/sign-in" replace />

  return <>{children}</>
}
