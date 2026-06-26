import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import LandingPage from './components/LandingPage'
import SignIn from './pages/SignIn'
import Verify from './pages/Verify'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './pages/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/verify" element={<Verify />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
