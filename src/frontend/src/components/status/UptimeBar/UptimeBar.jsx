import React from 'react'

import { buildUptimeGrid } from '@utils/uptime'

import styles from './UptimeBar.module.scss'

const getStatusLabel = (status) => {
  if (status === 'up') return 'Работает'
  if (status === 'down') return 'Сбой'
  return 'Нет данных'
}

const getTooltipStatusClass = (status) => {
  if (status === 'up') return styles.tooltipStatusUp
  if (status === 'down') return styles.tooltipStatusDown
  return styles.tooltipStatusNodata
}

export const UptimeBar = ({ history, className }) => {
  const [tooltip, setTooltip] = React.useState(null)
  const grid = React.useMemo(() => buildUptimeGrid(history), [history])

  const handleMouseEnter = React.useCallback((e, segment) => {
    setTooltip({ segment, left: e.currentTarget.offsetLeft })
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div className={styles.bar}>
        {grid.map((segment) => (
          <div
            key={segment.date}
            className={`${styles.segment} ${styles[segment.status]}`}
            onMouseEnter={(e) => handleMouseEnter(e, segment)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        {tooltip && (
          <div className={styles.tooltip} style={{ left: tooltip.left }}>
            <span className={styles.tooltipDate}>
              {new Date(tooltip.segment.date + 'T00:00:00').toLocaleDateString('ru-RU', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className={getTooltipStatusClass(tooltip.segment.status)}>
              {getStatusLabel(tooltip.segment.status)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
