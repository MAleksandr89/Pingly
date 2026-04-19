import React from 'react'
import cn from 'classnames'

import { Card } from '@ui/Card'
import { Badge } from '@ui/Badge'
import { MonitorStatusDot } from '@/components/monitors/MonitorStatusDot'
import { calcUptimePercent } from '@utils/uptime'
import { STATUS_LABELS } from '@/constants'

import styles from './MonitorCard.module.scss'

export const MonitorCard = ({ monitor, onCardClick }) => {
  const uptime = monitor.uptimePercent ?? calcUptimePercent(monitor.history)
  const status = monitor.currentStatus ?? 'nodata'

  const glowColor = status === 'up' ? 'green' : status === 'down' ? 'red' : 'purple'

  const handleClick = React.useCallback(() => {
    onCardClick(monitor.id)
  }, [onCardClick, monitor.id])

  return (
    <Card
      className={styles.card}
      hasGlow
      glowColor={glowColor}
      onClick={handleClick}
    >
      <div className={styles.header}>
        <div className={styles.nameRow}>
          <MonitorStatusDot status={status} size="sm" />
          <span className={styles.name}>{monitor.name}</span>
        </div>
        <Badge status={status}>{STATUS_LABELS[status]}</Badge>
      </div>
      <div className={styles.url}>
        {monitor.url.replace(/^https?:\/\//, '')}
      </div>
      <div className={styles.footer}>
        <span className={styles.uptimeLabel}>Доступность</span>
        <span className={styles.uptimeValue}>
          {uptime !== null ? `${uptime}%` : '—'}
        </span>
      </div>
    </Card>
  )
}
