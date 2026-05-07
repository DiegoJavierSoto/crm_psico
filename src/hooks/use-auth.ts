'use client'

import { useCallback } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useAppStore } from '@/store/app-store'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  licenseNumber?: string
  specialty?: string
}

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAppStore()

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setUser({
            id: data.user.id || '',
            email: data.user.email || '',
            name: data.user.name || '',
            phone: null,
            licenseNumber: null,
            specialty: null,
          })
          return true
        }
      }
      setUser(null)
      return false
    } catch {
      setUser(null)
      return false
    }
  }, [setUser])

  const login = useCallback(async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: 'Credenciales invalidas' }
      }

      if (result?.ok) {
        // Fetch session to get user data
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          if (sessionData?.user) {
            setUser({
              id: sessionData.user.id || '',
              email: sessionData.user.email || '',
              name: sessionData.user.name || '',
              phone: null,
              licenseNumber: null,
              specialty: null,
            })
          }
        }
        return { success: true }
      }

      return { success: false, error: 'Error al iniciar sesion' }
    } catch {
      return { success: false, error: 'Error de conexion' }
    }
  }, [setUser])

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return { success: false, error: errorData.error || 'Error al registrar' }
      }

      // After successful registration, auto-login with credentials
      const loginResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (loginResult?.ok) {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          if (sessionData?.user) {
            setUser({
              id: sessionData.user.id || '',
              email: sessionData.user.email || '',
              name: sessionData.user.name || '',
              phone: null,
              licenseNumber: null,
              specialty: null,
            })
          }
        }
        return { success: true }
      }

      // Registration succeeded but auto-login failed - redirect to login
      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexion' }
    }
  }, [setUser])

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false })
    } catch {
      // Continue with local logout even if API call fails
    }
    storeLogout()
  }, [storeLogout])

  return {
    user,
    isLoading: false,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  }
}
