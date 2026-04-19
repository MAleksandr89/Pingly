import React from 'react'

import { MonitorStatusDot } from '@/components/monitors/MonitorStatusDot'
import { UptimeBar } from '@/components/status/UptimeBar'
import { calcUptimePercent } from '@utils/uptime'

import styles from './StatusMonitorRow.module.scss'

export const StatusMonitorRow = ({ monitor }) => {
  const uptime = monitor.uptimePercent ?? calcUptimePercent(monitor.history)

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <div className={styles.header}>
          <div className={styles.nameRow}>
            <MonitorStatusDot status={monitor.currentStatus ?? 'nodata'} />
            <span className={styles.name}>{monitor.name}</span>
          </div>
          <span className={styles.uptime}>
            {uptime !== null ? `${uptime}%` : '—'}
          </span>
        </div>
        <UptimeBar history={monitor.history} className={styles.bar} />
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Доступность за 90 дней</span>
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            className={styles.url}
          >
            {monitor.url.replace(/^https?:\/\//, '')}
          </a>
        </div>
      </div>
    </div>
  )
}
