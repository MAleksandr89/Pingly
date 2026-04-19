import React from 'react'
import cn from 'classnames'

import styles from './TextField.module.scss'

export const TextField = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError = false,
  errorMessage,
  label,
  id,
  className,
}) => {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(styles.input, { [styles.error]: hasError })}
      />
      {hasError && errorMessage && (
        <span className={styles.errorMsg}>{errorMessage}</span>
      )}
    </div>
  )
}
