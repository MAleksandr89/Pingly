import React from 'react'

import { Button } from '@ui/Button'
import { TextField } from '@ui/TextField'
import { MONITOR_INTERVALS } from '@/constants'

import styles from './MonitorForm.module.scss'

const validateUrl = (url) =>
  /^https?:\/\/.+/.test(url) ? null : 'URL должен начинаться с http:// или https://'

export const MonitorForm = ({ initialValues, onSubmit, isLoading, onCancel }) => {
  const [name, setName] = React.useState(initialValues?.name ?? '')
  const [url, setUrl] = React.useState(initialValues?.url ?? '')
  const [interval, setInterval] = React.useState(initialValues?.intervalMinutes ?? 5)
  const [errors, setErrors] = React.useState({})

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Укажите название'
    const urlErr = validateUrl(url)
    if (urlErr) errs.url = urlErr
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSubmit({ name: name.trim(), url, intervalMinutes: interval })
  }, [name, url, interval, onSubmit])

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <TextField
        label="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Мой сайт"
        hasError={!!errors.name}
        errorMessage={errors.name}
      />
      <TextField
        label="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        hasError={!!errors.url}
        errorMessage={errors.url}
      />
      <div className={styles.field}>
        <label className={styles.label}>Интервал проверки</label>
        <select
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className={styles.select}
        >
          {MONITOR_INTERVALS.map(m => (
            <option key={m} value={m}>
              {m === 1 ? 'Каждую минуту' : m === 60 ? 'Каждый час' : `Каждые ${m} мин.`}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {initialValues ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  )
}
