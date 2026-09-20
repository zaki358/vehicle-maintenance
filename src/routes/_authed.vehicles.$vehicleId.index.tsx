import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/page-header'
import { deleteVehicleFn } from '@/features/vehicles/server/delete'
import { vehicleTypeLabel } from '@/features/vehicles/lib/vehicle-type'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'
import { shakenRequired } from '@/features/vehicles/lib/shaken-required'
import { shakenAlertTier } from '@/features/shaken/lib/alert-tier'
import { daysUntilExpiry } from '@/features/shaken/lib/days-remaining'
import { shakenTierMessage } from '@/features/shaken/lib/messages'
import { toDateString } from '@/lib/date/date-string'
import { formatJa } from '@/lib/date/format-ja'
import { todayInJst } from '@/lib/date/jst'
import { deleteRecordFn } from '@/features/maintenance/server/delete'
import { listRecordsFn } from '@/features/maintenance/server/list'
import type { MaintenanceRecordRow } from '@/features/maintenance/server/list'
import { filterRecords } from '@/features/maintenance/lib/filter-records'
import { sortRecords } from '@/features/maintenance/lib/sort-records'
import { WORK_TYPES, workTypeLabel } from '@/features/maintenance/lib/work-types'
import type { WorkType } from '@/features/maintenance/lib/work-types'

export const Route = createFileRoute('/_authed/vehicles/$vehicleId/')({
  loader: ({ params }) => listRecordsFn({ data: { vehicleId: params.vehicleId } }),
  component: VehicleDetailPage,
})

/**
 * DBの行（スネークケース）を `filter-records.ts`/`sort-records.ts` が要求する
 * 形（キャメルケース）へ変換する。`toDateString` は `maintenance_records.performed_on`
 * が常に検証済みの `date` 列であることが前提（不正な形式ならここで例外になる）。
 */
function toFilterable(row: MaintenanceRecordRow) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    workType: row.work_type as WorkType,
    detail: row.detail,
    performedOn: toDateString(row.performed_on),
    odometerKm: row.odometer_km,
    partDetail: row.part_detail,
    oilType: row.oil_type,
    elementChanged: row.element_changed,
  }
}

function VehicleDetailPage() {
  const { vehicle } = Route.useRouteContext()
  const records = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [deletingVehicle, setDeletingVehicle] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | 'all'>('all')
  const [deleteVehicleError, setDeleteVehicleError] = useState<string | null>(null)
  const [deleteRecordError, setDeleteRecordError] = useState<string | null>(null)

  async function handleDeleteVehicle() {
    const confirmed = window.confirm(`「${vehicle.name}」を削除します。整備記録も全て削除されます。よろしいですか？`)
    if (!confirmed) {
      return
    }
    setDeletingVehicle(true)
    setDeleteVehicleError(null)
    try {
      await deleteVehicleFn({ data: { id: vehicle.id } })
      await navigate({ to: '/vehicles' })
    } catch {
      setDeleteVehicleError('削除に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setDeletingVehicle(false)
    }
  }

  const visibleRecords = useMemo(() => {
    const filterable = records.map(toFilterable)
    const filtered = filterRecords(filterable, {
      workType: workTypeFilter === 'all' ? undefined : workTypeFilter,
    })
    return sortRecords(filtered, 'newest')
  }, [records, workTypeFilter])

  async function handleDeleteRecord(recordId: string) {
    const confirmed = window.confirm('この整備記録を削除します。よろしいですか？')
    if (!confirmed) {
      return
    }
    setDeletingRecordId(recordId)
    setDeleteRecordError(null)
    try {
      await deleteRecordFn({ data: { id: recordId } })
      await router.invalidate()
    } catch {
      setDeleteRecordError('削除に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setDeletingRecordId(null)
    }
  }

  const shakenExpiryDate = vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null
  const shakenTier = shakenAlertTier(shakenExpiryDate, todayInJst())
  const shakenMessage =
    shakenTier === 'none' ? null : shakenTierMessage(shakenTier, daysUntilExpiry(shakenExpiryDate, todayInJst()))

  return (
    <>
      <PageHeader
        title={vehicle.name}
        actions={
          <Link
            to="/vehicles/$vehicleId/records/new"
            params={{ vehicleId: vehicle.id }}
            className="btn btn-primary"
          >
            整備を記録
          </Link>
        }
      />

      <section className="section section-compact section-light">
        <div className="container container-reading stack">
          <div className="card">
            <div className="card-meta">
              <span>
                <span className="card-meta-label">車両区分 </span>
                {vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}
              </span>
              {vehicle.model_code && (
                <span>
                  <span className="card-meta-label">型式 </span>
                  {vehicle.model_code}
                </span>
              )}
              <span>
                <span className="card-meta-label">車検満了日 </span>
                {shakenExpiryDate ? formatJa(shakenExpiryDate) : '車検対象外'}
              </span>
            </div>
            {vehicle.note && <p>{vehicle.note}</p>}
            {shakenRequired(shakenExpiryDate) && shakenMessage && (
              <p
                role={shakenTier === 'warning' ? 'status' : 'alert'}
                className={`card-alert ${shakenTier === 'warning' ? 'card-alert-warning' : 'card-alert-danger'}`}
              >
                {shakenMessage}
              </p>
            )}
            <div className="card-actions">
              {shakenRequired(shakenExpiryDate) && (
                <Link
                  to="/vehicles/$vehicleId/records/new"
                  params={{ vehicleId: vehicle.id }}
                  search={{ workType: 'shaken' }}
                  className="btn btn-secondary"
                >
                  車検完了を記録
                </Link>
              )}
              <Link
                to="/vehicles/$vehicleId/edit"
                params={{ vehicleId: vehicle.id }}
                className="btn btn-pearl"
              >
                編集
              </Link>
              <button type="button" className="btn btn-pearl" onClick={handleDeleteVehicle} disabled={deletingVehicle}>
                削除
              </button>
            </div>
            {deleteVehicleError && (
              <p role="alert" className="alert">
                {deleteVehicleError}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container container-reading stack">
          <div className="section-head">
            <h2>整備記録</h2>
          </div>

          <label className="field field-compact">
            <span className="field-label">作業内容で絞り込み</span>
            <select
              className="field-select"
              value={workTypeFilter}
              onChange={(event) => setWorkTypeFilter(event.target.value as WorkType | 'all')}
            >
              <option value="all">すべて</option>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {workTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          {visibleRecords.length === 0 ? (
            <div className="empty-state">
              <p>整備記録はまだありません。</p>
              <Link
                to="/vehicles/$vehicleId/records/new"
                params={{ vehicleId: vehicle.id }}
                className="btn btn-primary"
              >
                最初の記録を追加
              </Link>
            </div>
          ) : (
            <ul className="card">
              {visibleRecords.map((record) => (
                <li key={record.id} className="list-row">
                  <span className="list-row-primary">{formatJa(record.performedOn)}</span>
                  <span>{workTypeLabel(record.workType)}</span>
                  <span className="list-row-meta">
                    {[
                      record.detail,
                      record.oilType,
                      record.elementChanged ? 'エレメント交換' : '',
                      record.partDetail,
                      record.odometerKm != null ? `${record.odometerKm.toLocaleString()}km` : '',
                    ]
                      .filter(Boolean)
                      .join('・')}
                  </span>
                  <span className="card-actions">
                    <Link
                      to="/vehicles/$vehicleId/records/$recordId/edit"
                      params={{ vehicleId: vehicle.id, recordId: record.id }}
                      className="btn btn-pearl"
                    >
                      編集
                    </Link>
                    <button
                      type="button"
                      className="btn btn-pearl"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={deletingRecordId === record.id}
                    >
                      削除
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {deleteRecordError && (
            <p role="alert" className="alert">
              {deleteRecordError}
            </p>
          )}

          <p>
            <Link to="/vehicles">車両一覧へ戻る</Link>
          </p>
        </div>
      </section>
    </>
  )
}
