import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

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
    workTypeOther: row.work_type_other,
    performedOn: toDateString(row.performed_on),
    odometerKm: row.odometer_km,
    partDetail: row.part_detail,
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
    <main>
      <h1>{vehicle.name}</h1>
      <p>車両区分: {vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}</p>
      <p>
        車検満了日: {shakenExpiryDate ? formatJa(shakenExpiryDate) : '車検対象外'}
      </p>
      {shakenRequired(shakenExpiryDate) && (
        <section>
          {shakenMessage && <p role={shakenTier === 'warning' ? 'status' : 'alert'}>{shakenMessage}</p>}
          <p>
            <Link to="/vehicles/$vehicleId/shaken" params={{ vehicleId: vehicle.id }}>
              車検完了を記録
            </Link>
          </p>
        </section>
      )}
      {vehicle.note && <p>備考: {vehicle.note}</p>}
      <p>
        <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: vehicle.id }}>
          編集
        </Link>
      </p>
      <button type="button" onClick={handleDeleteVehicle} disabled={deletingVehicle}>
        削除
      </button>
      {deleteVehicleError && <p role="alert">{deleteVehicleError}</p>}

      <section>
        <h2>整備記録</h2>
        <p>
          <Link to="/vehicles/$vehicleId/records/new" params={{ vehicleId: vehicle.id }}>
            ＋ 整備記録を追加
          </Link>
        </p>
        <label>
          作業内容で絞り込み
          <select
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
          <p>整備記録はまだありません。</p>
        ) : (
          <ul>
            {visibleRecords.map((record) => (
              <li key={record.id}>
                {formatJa(record.performedOn)}・
                {record.workType === 'other' ? record.workTypeOther : workTypeLabel(record.workType)}
                {record.odometerKm != null && `・${record.odometerKm}km`}
                {record.partDetail && `・${record.partDetail}`}{' '}
                <Link
                  to="/vehicles/$vehicleId/records/$recordId/edit"
                  params={{ vehicleId: vehicle.id, recordId: record.id }}
                >
                  編集
                </Link>{' '}
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(record.id)}
                  disabled={deletingRecordId === record.id}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
        {deleteRecordError && <p role="alert">{deleteRecordError}</p>}
      </section>

      <p>
        <Link to="/vehicles">車両一覧へ戻る</Link>
      </p>
    </main>
  )
}
