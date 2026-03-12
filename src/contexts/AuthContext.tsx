import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/auth'
import type { Profile } from '../types'

interface AuthContextType {
  user: any | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'manager' | 'caregiver', organization?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser, userProfile) => {
      console.log('Auth state changed:', { authUser, userProfile })
      setUser(authUser)
      setProfile(userProfile)
      setLoading(false)
    })

    return () => {
      unsubscribe.data?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authService.signIn(email, password)
      console.log('Sign in successful, user:', authUser)

      if (authUser) {
        try {
          const profile = await authService.getUserProfile()
          console.log('Profile fetched:', profile)
          setUser(authUser)
          setProfile(profile)
        } catch (profileError) {
          console.error('Profile fetch error:', profileError)
          setUser(authUser)
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'manager' | 'caregiver', organization?: string) => {
    await authService.signUp(email, password, firstName, lastName, role, organization)
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
