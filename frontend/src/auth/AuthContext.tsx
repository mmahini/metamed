import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authRequest, refreshToken as apiRefresh } from './api'

interface User {
  id: number
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  access: string | null
  refresh: string | null
  isLoading: boolean
}

interface AuthActions {
  login: (access: string, refresh: string, user: User) => void
  logout: () => void
  getAccess: () => Promise<string | null>
}

type AuthCtx = AuthState & AuthActions

const AuthContext = createContext<AuthCtx | null>(null)

const STORAGE = {
  ACCESS: 'mm_access',
  REFRESH: 'mm_refresh',
  USER: 'mm_user',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const access = localStorage.getItem(STORAGE.ACCESS)
      const refresh = localStorage.getItem(STORAGE.REFRESH)
      const user = JSON.parse(localStorage.getItem(STORAGE.USER) ?? 'null') as User | null
      return { access, refresh, user, isLoading: !!access }
    } catch {
      return { access: null, refresh: null, user: null, isLoading: false }
    }
  })

  const login = useCallback((access: string, refresh: string, user: User) => {
    localStorage.setItem(STORAGE.ACCESS, access)
    localStorage.setItem(STORAGE.REFRESH, refresh)
    localStorage.setItem(STORAGE.USER, JSON.stringify(user))
    setState({ access, refresh, user, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE.ACCESS)
    localStorage.removeItem(STORAGE.REFRESH)
    localStorage.removeItem(STORAGE.USER)
    setState({ access: null, refresh: null, user: null, isLoading: false })
  }, [])

  const getAccess = useCallback(async (): Promise<string | null> => {
    if (state.access) return state.access
    if (!state.refresh) return null
    try {
      const { access } = await apiRefresh(state.refresh)
      localStorage.setItem(STORAGE.ACCESS, access)
      setState(prev => ({ ...prev, access }))
      return access
    } catch {
      logout()
      return null
    }
  }, [state.access, state.refresh, logout])

  /* Validate stored token on mount — fetch /me */
  useEffect(() => {
    if (!state.access) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }
    authRequest<User>('me', undefined, state.access)
      .then(user => setState(prev => ({ ...prev, user, isLoading: false })))
      .catch(() => {
        if (!state.refresh) { logout(); return }
        apiRefresh(state.refresh)
          .then(({ access }) => {
            localStorage.setItem(STORAGE.ACCESS, access)
            return authRequest<User>('me', undefined, access)
          })
          .then(user => setState(prev => ({ ...prev, user, isLoading: false })))
          .catch(logout)
      })
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ ...state, login, logout, getAccess }),
    [state, login, logout, getAccess],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
