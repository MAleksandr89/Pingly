import React from 'react'

import { useStatus } from '@/hooks/useStatus'
import { Badge } from '@ui/Badge'
import { Skeleton } from '@ui/Skeleton'
import { StatusMonitorRow } from '@/components/status/StatusMonitorRow'

import styles from './StatusPage.module.scss'

export const StatusPage = () => {
  const { data: monitors, isLoading } = useStatus()

  const hasIncident = monitors?.some(m => m.currentStatus === 'down')
  const overallStatus = hasIncident ? 'down' : 'up'

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandMark} />
          <span className={styles.logo}>Pingly</span>
          <span className={styles.logoSub}>статус</span>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroHead}>
          {isLoading ? (
            <Skeleton width="320px" height="44px" borderRadius="8px" />
          ) : (
            <h1 className={styles.heroTitle}>
              {hasIncident
                ? <>Есть <em className={styles.heroTitleEm}>проблемы.</em><br />Инцидент активен.</>
                : <>Все системы <em className={styles.heroTitleEm}>работают.</em><br />Инцидентов нет.</>
              }
            </h1>
          )}
        </div>

        <div className={styles.statusCard}>
          <span className={styles.statusHalo} />
          <div className={styles.statusRow}>
            <div className={styles.statusTitle}>
              <span className={`${styles.statusDot} ${hasIncident ? styles.statusDotDown : ''}`} />
              <div className={styles.statusLabel}>
                <h2>{hasIncident ? 'Обнаружен сбой' : 'Всё в норме'}</h2>
                <p>Мониторов: {monitors?.length ?? '—'} · обновлено только что</p>
              </div>
            </div>
            <Badge status={overallStatus} hasDot>
              {hasIncident ? 'Сбой' : 'Работает'}
            </Badge>
          </div>
        </div>
      </section>

      <section className={styles.monitors}>
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height="100px" borderRadius="14px" />
            ))}
          </>
        ) : monitors?.length ? (
          <div className={styles.monitorList}>
            {monitors.map(m => (
              <StatusMonitorRow key={m.id} monitor={m} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Мониторов пока нет.</div>
        )}
      </section>

      <footer className={styles.footer}>
        <span>Pingly · self-hosted</span>
      </footer>
    </main>
  )
}
