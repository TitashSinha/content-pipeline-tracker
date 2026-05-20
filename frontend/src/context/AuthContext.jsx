import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialise from localStorage so the session survives a page refresh
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cpt_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  function login(token, userData) {
    localStorage.setItem('cpt_token', token)
    localStorage.setItem('cpt_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('cpt_token')
    localStorage.removeItem('cpt_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
