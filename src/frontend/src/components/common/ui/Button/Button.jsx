import React from 'react'
import cn from 'classnames'

import { Loader } from '@ui/Loader'

import styles from './Button.module.scss'

export const Button = ({
  variant = 'primary',
  isDisabled = false,
  isLoading = false,
  size = 'md',
  onClick,
  children,
  className,
  type = 'button',
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={isDisabled || isLoading}
    className={cn(
      styles.button,
      styles[variant],
      styles[size],
      { [styles.disabled]: isDisabled, [styles.loading]: isLoading },
      className
    )}
  >
    {isLoading && <Loader size="sm" />}
    {children}
  </button>
)
