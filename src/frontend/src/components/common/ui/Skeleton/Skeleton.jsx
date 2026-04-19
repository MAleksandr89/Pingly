import React from 'react'
import cn from 'classnames'

import styles from './Skeleton.module.scss'

export const Skeleton = ({ width, height, borderRadius = '8px', className }) => (
  <div
    style={{ width, height, borderRadius }}
    className={cn(styles.skeleton, className)}
  />
)
