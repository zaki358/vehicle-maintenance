import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

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
export const Route = createFileRoute('/_authed/vehicles/$vehicleId/records/new')({
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

  return (
    <main>
      <h1>{vehicle.name} の整備記録を追加</h1>
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={partSuggestionsList}
        existingReadings={existingReadings}
        onSubmit={handleSubmit}
      />
      <p>
        <Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>
          キャンセルして詳細へ戻る
        </Link>
      </p>
    </main>
  )
}
