import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/page-header'
import { completeShakenFn } from '@/features/shaken/server/complete-shaken'
import type { CompleteShakenInput } from '@/features/shaken/lib/complete-shaken-schema'
import { WORK_TYPES } from '@/features/maintenance/lib/work-types'
import { createRecordFn } from '@/features/maintenance/server/create'
import { listPartDetailsFn } from '@/features/maintenance/server/list-part-details'
import { listRecordsFn } from '@/features/maintenance/server/list'
import { partSuggestions } from '@/features/maintenance/lib/part-suggestions'
import type { OdometerReading } from '@/features/maintenance/lib/odometer'
import type { RecordInput } from '@/features/maintenance/lib/record-schema'
import { RecordForm } from '@/features/maintenance/record-form'
import type { RecordFormResult } from '@/features/maintenance/record-form'
import { toDateString } from '@/lib/date/date-string'

/**
 * 部品サジェスト（`listPartDetailsFn`）と走行距離逆行チェック用の既存記録
 * （`listRecordsFn`）を並行して取得する。どちらもこの車両の登録済み整備記録に
 * 依存するが、互いには依存しないため `Promise.all` で同時に投げる。
 */
/**
 * ダッシュボードや車両詳細の「車検完了を記録」から、作業内容を車検にした状態で
 * 開けるようにする（`?workType=shaken`）。未知の値は既定の区分へ落とす。
 */
const recordSearchSchema = z.object({
  workType: z.enum(WORK_TYPES).optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/vehicles/$vehicleId/records/new')({
  validateSearch: recordSearchSchema,
  loader: async ({ params }) => {
    const [records, partDetails] = await Promise.all([
      listRecordsFn({ data: { vehicleId: params.vehicleId } }),
      listPartDetailsFn({ data: { vehicleId: params.vehicleId } }),
    ])
    return { records, partDetails }
  },
  component: NewRecordPage,
})

function NewRecordPage() {
  const { vehicle } = Route.useRouteContext()
  const { records, partDetails } = Route.useLoaderData()
  const { workType } = Route.useSearch()
  const navigate = useNavigate()

  const partSuggestionsList = partSuggestions(partDetails.map((row) => ({ partDetail: row.part_detail })))
  const existingReadings: OdometerReading[] = records
    .filter((record) => record.odometer_km !== null)
    .map((record) => ({ performedOn: toDateString(record.performed_on), odometerKm: record.odometer_km as number }))

  async function handleSubmit(input: RecordInput): Promise<RecordFormResult> {
    try {
      await createRecordFn({ data: { vehicleId: vehicle.id, record: input } })
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '登録に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  // 車検は記録の追加と満了日の更新を1トランザクションで行う必要があるため、
  // 通常の整備記録とは別のサーバー関数（complete_shaken RPC）へ回す。
  async function handleShakenSubmit(input: CompleteShakenInput): Promise<RecordFormResult> {
    try {
      await completeShakenFn({ data: { vehicleId: vehicle.id, shaken: input } })
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '記録に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  return (
    <>
      <PageHeader title="整備記録を追加" />
      <main className="section section-compact">
        <div className="container container-narrow stack">
          <div className="card">
            <p className="card-meta">{vehicle.name}</p>
            <RecordForm
              submitLabel="登録"
              initialWorkType={workType}
              partSuggestionsList={partSuggestionsList}
              existingReadings={existingReadings}
              shakenRenewal={{
                currentExpiry: vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null,
                onSubmit: handleShakenSubmit,
              }}
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
