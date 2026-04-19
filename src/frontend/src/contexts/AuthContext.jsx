import React from 'react'

const AuthContext = React.createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = React.useState(
    () => localStorage.getItem('access_token')
  )

  const login = React.useCallback((newToken) => {
    localStorage.setItem('access_token', newToken)
    setToken(newToken)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
  }, [])

  const value = React.useMemo(
    () => ({ token, isAuthenticated: !!token, login, logout }),
    [token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
