import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useMonitorsWithStatus, useMonitorIncidents, useUpdateMonitor, useDeleteMonitor } from '@/hooks/useMonitors'
import { Badge } from '@ui/Badge'
import { Button } from '@ui/Button'
import { Skeleton } from '@ui/Skeleton'
import { MonitorForm } from '@/components/monitors/MonitorForm'
import { UptimeBar } from '@/components/status/UptimeBar'
import { ArrowLeftIcon, PencilIcon, TrashIcon, ExternalLinkIcon } from '@/components/common/assets/Icons'
import { calcUptimePercent } from '@utils/uptime'
import { STATUS_LABELS, ROUTES } from '@/constants'

import styles from './MonitorDetailPage.module.scss'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('ru-RU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDuration = (start, end) => {
  const ms = new Date(end) - new Date(start)
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} мин.`
  return `${Math.floor(mins / 60)} ч ${mins % 60} мин.`
}

export const MonitorDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: monitors, isLoading } = useMonitorsWithStatus()
  const { data: incidents } = useMonitorIncidents(id)
  const updateMonitor = useUpdateMonitor()
  const deleteMonitor = useDeleteMonitor()
  const [isEditing, setIsEditing] = React.useState(false)

  const monitor = React.useMemo(
    () => monitors?.find(m => String(m.id) === String(id)),
    [monitors, id]
  )

  const handleBack = React.useCallback(() => navigate(ROUTES.dashboard), [navigate])

  const handleUpdate = React.useCallback((data) => {
    updateMonitor.mutate({ id, data }, { onSuccess: () => setIsEditing(false) })
  }, [id, updateMonitor])

  const handleDelete = React.useCallback(() => {
    if (!window.confirm(`Удалить монитор "${monitor?.name}"?`)) return
    deleteMonitor.mutate(id, { onSuccess: () => navigate(ROUTES.dashboard) })
  }, [id, monitor, deleteMonitor, navigate])

  const handleEditClose = React.useCallback(() => setIsEditing(false), [])
  const handleEditOpen = React.useCallback(() => setIsEditing(true), [])

  const handleOverlayClick = React.useCallback((e) => {
    if (e.target === e.currentTarget) setIsEditing(false)
  }, [])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton width="200px" height="24px" />
        <div className={styles.skeletonGap} />
        <Skeleton width="100%" height="80px" borderRadius="16px" />
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className={styles.page}>
        <p className={styles.notFound}>Монитор не найден.</p>
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeftIcon size="16px" /> Назад
        </Button>
      </div>
    )
  }

  const uptimePercent = monitor.uptimePercent ?? calcUptimePercent(monitor.history)
  const status = monitor.currentStatus ?? 'nodata'

  const activeIncidents = incidents?.filter(i => !i.resolvedAt) ?? []
  const resolvedIncidents = incidents?.filter(i => i.resolvedAt) ?? []

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={handleBack} type="button">
        <ArrowLeftIcon size="16px" /> Назад
      </button>

      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <h1 className={styles.title}>{monitor.name}</h1>
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            className={styles.url}
          >
            {monitor.url} <ExternalLinkIcon size="12px" />
          </a>
        </div>
        <div className={styles.titleRight}>
          <Badge status={status}>{STATUS_LABELS[status]}</Badge>
          <Button variant="secondary" size="sm" onClick={handleEditOpen}>
            <PencilIcon size="14px" /> Изменить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteMonitor.isPending}
          >
            <TrashIcon size="14px" color="var(--error)" />
          </Button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Доступность за 90 дней</span>
          <span className={styles.statValue}>
            {uptimePercent !== null ? `${uptimePercent}%` : '—'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Инцидентов всего</span>
          <span className={styles.statValue}>{incidents?.length ?? '—'}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Активных</span>
          <span className={`${styles.statValue} ${activeIncidents.length ? styles.statValueRed : ''}`}>
            {activeIncidents.length}
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Доступность за 90 дней</h2>
        <UptimeBar history={monitor.history} />
        <div className={styles.barLabels}>
          <span>90 дней назад</span>
          <span>Сегодня</span>
        </div>
      </div>

      {incidents?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Инциденты</h2>
          <div className={styles.incidentList}>
            {activeIncidents.map(i => (
              <div key={i.id} className={`${styles.incident} ${styles.incidentActive}`}>
                <Badge status="down">Активный</Badge>
                <span className={styles.incidentDate}>Начался {formatDate(i.startedAt)}</span>
              </div>
            ))}
            {resolvedIncidents.map(i => (
              <div key={i.id} className={styles.incident}>
                <Badge status="up">Завершён</Badge>
                <span className={styles.incidentDate}>{formatDate(i.startedAt)}</span>
                <span className={styles.incidentDuration}>
                  Длительность: {formatDuration(i.startedAt, i.resolvedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Редактировать монитор</h2>
            <MonitorForm
              initialValues={monitor}
              onSubmit={handleUpdate}
              isLoading={updateMonitor.isPending}
              onCancel={handleEditClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}
