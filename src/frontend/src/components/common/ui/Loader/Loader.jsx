import React from 'react'
import cn from 'classnames'

import styles from './Loader.module.scss'

export const Loader = ({ size = 'md', className }) => (
  <span className={cn(styles.loader, styles[size], className)} />
)
