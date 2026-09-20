import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'

import { updateRecordFn } from '@/features/maintenance/server/update'
import { listPartDetailsFn } from '@/features/maintenance/server/list-part-details'
import { listRecordsFn } from '@/features/maintenance/server/list'
import { partSuggestions } from '@/features/maintenance/lib/part-suggestions'
import type { OdometerReading } from '@/features/maintenance/lib/odometer'
import type { RecordInput } from '@/features/maintenance/lib/record-schema'
import type { WorkType } from '@/features/maintenance/lib/work-types'
import { RecordForm } from '@/features/maintenance/record-form'
import type { RecordFormResult } from '@/features/maintenance/record-form'
import { toDateString } from '@/lib/date/date-string'

/**
 * 専用の「1件取得」サーバー関数は用意していない（`server/` は
 * list/create/update/delete/list-part-details の5本という実装プランどおりの構成）。
 * 代わりに車両スコープの一覧を取得し、対象IDをここで絞り込む。他の車両の記録・
 * 他人の記録（RLSで一覧に出てこない）を指定した場合は見つからず、
 * `_authed.vehicles.$vehicleId.tsx` と同じ `notFound()` で統一する。
 */
export const Route = createFileRoute('/_authed/vehicles/$vehicleId/records/$recordId/edit')({
  loader: async ({ params }) => {
    const [records, partDetails] = await Promise.all([
      listRecordsFn({ data: { vehicleId: params.vehicleId } }),
      listPartDetailsFn({ data: { vehicleId: params.vehicleId } }),
    ])
    const record = records.find((candidate) => candidate.id === params.recordId)
    if (!record) {
      throw notFound()
    }
    return { record, records, partDetails }
  },
  notFoundComponent: RecordNotFound,
  component: EditRecordPage,
})

function RecordNotFound() {
  const { vehicle } = Route.useRouteContext()
  return (
    <main className="section section-compact">
      <div className="container container-narrow">
        <div className="empty-state">
          <h1>整備記録が見つかりません</h1>
          <p>指定された整備記録は存在しないか、閲覧できません。</p>
          <Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }} className="btn btn-secondary">
            車両詳細へ戻る
          </Link>
        </div>
      </div>
    </main>
  )
}

function EditRecordPage() {
  const { vehicle } = Route.useRouteContext()
  const { record, records, partDetails } = Route.useLoaderData()
  const navigate = useNavigate()

  const initialValues: RecordInput = {
    performedOn: toDateString(record.performed_on),
    workType: record.work_type as WorkType,
    detail: record.detail,
    odometerKm: record.odometer_km,
    partDetail: record.part_detail,
    oilType: record.oil_type,
    elementChanged: record.element_changed,
    note: record.note,
  }

  const partSuggestionsList = partSuggestions(partDetails.map((row) => ({ partDetail: row.part_detail })))
  const existingReadings: OdometerReading[] = records
    .filter((candidate) => candidate.id !== record.id && candidate.odometer_km !== null)
    .map((candidate) => ({
      performedOn: toDateString(candidate.performed_on),
      odometerKm: candidate.odometer_km as number,
    }))

  async function handleSubmit(input: RecordInput): Promise<RecordFormResult> {
    try {
      const updated = await updateRecordFn({ data: { id: record.id, record: input } })
      if (!updated) {
        return { success: false, error: '更新に失敗しました。整備記録が見つかりませんでした。' }
      }
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '更新に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  return (
    <>
      <PageHeader title="整備記録を編集" />
      <main className="section section-compact">
        <div className="container container-narrow stack">
          <div className="card">
            <p className="card-meta">{vehicle.name}</p>
            <RecordForm
              submitLabel="更新"
              initialValues={initialValues}
              partSuggestionsList={partSuggestionsList}
              existingReadings={existingReadings}
              onSubmit={handleSubmit}
            />
          </div>
          <p>
            <Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>
              キャンセルして詳細へ戻る
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
