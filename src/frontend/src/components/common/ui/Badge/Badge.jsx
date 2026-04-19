import React from 'react'
import cn from 'classnames'

import styles from './Badge.module.scss'

export const Badge = ({ status, children, hasDot = false, className }) => (
  <span className={cn(styles.badge, styles[status], className)}>
    {hasDot && <span className={cn(styles.dot, styles[`dot${status.charAt(0).toUpperCase()}${status.slice(1)}`])} />}
    {children}
  </span>
)
