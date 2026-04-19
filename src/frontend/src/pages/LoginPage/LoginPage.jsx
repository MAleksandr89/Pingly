import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { useAuth } from '@/contexts/AuthContext'
import { loginUser, registerUser } from '@/api/auth'
import { Card } from '@ui/Card'
import { TextField } from '@ui/TextField'
import { Button } from '@ui/Button'

import styles from './LoginPage.module.scss'

export const LoginPage = () => {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = React.useState('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState(null)

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.accessToken)
      navigate('/')
    },
    onError: (err) => setError(err.response?.data?.detail ?? 'Не удалось войти'),
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setTab('login')
      setError(null)
    },
    onError: (err) => setError(err.response?.data?.detail ?? 'Не удалось зарегистрироваться'),
  })

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault()
    setError(null)
    const data = { email, password }
    if (tab === 'login') loginMutation.mutate(data)
    else registerMutation.mutate(data)
  }, [email, password, tab, loginMutation, registerMutation])

  const handleTabLogin = React.useCallback(() => {
    setTab('login')
    setError(null)
  }, [])

  const handleTabRegister = React.useCallback(() => {
    setTab('register')
    setError(null)
  }, [])

  if (isAuthenticated) return <Navigate to="/" replace />

  const isLoading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.brandMark} />
          <span className={styles.logo}>Pingly</span>
        </div>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`}
            onClick={handleTabLogin}
          >
            Войти
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`}
            onClick={handleTabRegister}
          >
            Регистрация
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
            {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
