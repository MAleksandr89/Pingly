import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { useMonitorsWithStatus, useCreateMonitor } from '@/hooks/useMonitors'
import { useAuth } from '@/contexts/AuthContext'
import { MonitorCard } from '@/components/monitors/MonitorCard'
import { MonitorForm } from '@/components/monitors/MonitorForm'
import { Button } from '@ui/Button'
import { Skeleton } from '@ui/Skeleton'
import { PlusIcon, LogOutIcon } from '@/components/common/assets/Icons'
import { ROUTES } from '@/constants'

import styles from './DashboardPage.module.scss'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data: monitors, isLoading } = useMonitorsWithStatus()
  const createMonitor = useCreateMonitor()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleOpenModal = React.useCallback(() => setIsModalOpen(true), [])
  const handleCloseModal = React.useCallback(() => setIsModalOpen(false), [])

  const handleCreate = React.useCallback((data) => {
    createMonitor.mutate(data, { onSuccess: handleCloseModal })
  }, [createMonitor, handleCloseModal])

  const handleCardClick = React.useCallback((id) => {
    navigate(ROUTES.monitorDetail(id))
  }, [navigate])

  const handleOverlayClick = React.useCallback((e) => {
    if (e.target === e.currentTarget) handleCloseModal()
  }, [handleCloseModal])

  React.useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, handleCloseModal])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandMark} />
          <span className={styles.logo}>Pingly</span>
        </div>
        <div className={styles.headerActions}>
          <Link to="/status" className={styles.statusLink}>Страница статуса</Link>
          <button
            className={styles.iconBtn}
            onClick={logout}
            type="button"
            aria-label="Выйти"
          >
            <LogOutIcon size="18px" />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Мониторы</h1>
          <Button onClick={handleOpenModal}>
            <PlusIcon size="16px" color="#fff" /> Добавить монитор
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height="140px" borderRadius="16px" />
            ))}
          </div>
        ) : monitors?.length ? (
          <div className={styles.grid}>
            {monitors.map(m => (
              <MonitorCard
                key={m.id}
                monitor={m}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📡</div>
            <h2 className={styles.emptyTitle}>Нет мониторов</h2>
            <p className={styles.emptyText}>
              Добавьте URL — будем проверять по расписанию.
            </p>
            <Button onClick={handleOpenModal}>
              <PlusIcon size="16px" color="#fff" /> Добавить монитор
            </Button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Новый монитор</h2>
            <MonitorForm
              onSubmit={handleCreate}
              isLoading={createMonitor.isPending}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}
