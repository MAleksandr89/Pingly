import React from 'react'
import cn from 'classnames'

import styles from './MonitorStatusDot.module.scss'

export const MonitorStatusDot = ({ status, size = 'md' }) => (
  <span className={cn(styles.dot, styles[size], styles[status])} />
)
