import React from 'react'
import cn from 'classnames'

import styles from './Card.module.scss'

export const Card = ({
  className,
  children,
  hasGlow = false,
  glowColor = 'purple',
  onClick,
}) => (
  <div
    className={cn(
      styles.card,
      { [styles.glow]: hasGlow },
      hasGlow && styles[`glow${glowColor.charAt(0).toUpperCase()}${glowColor.slice(1)}`],
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
)
