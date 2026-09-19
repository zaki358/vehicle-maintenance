import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { completeShakenFn } from '@/features/shaken/server/complete-shaken'
import { ShakenForm } from '@/features/shaken/complete-shaken-form'
import type { ShakenFormResult } from '@/features/shaken/complete-shaken-form'
import type { CompleteShakenInput } from '@/features/shaken/lib/complete-shaken-schema'
import { toDateString } from '@/lib/date/date-string'

export const Route = createFileRoute('/_authed/vehicles/$vehicleId/shaken')({
  component: CompleteShakenPage,
})

function CompleteShakenPage() {
  const { vehicle } = Route.useRouteContext()
  const navigate = useNavigate()

  async function handleSubmit(input: CompleteShakenInput): Promise<ShakenFormResult> {
    try {
      await completeShakenFn({ data: { vehicleId: vehicle.id, shaken: input } })
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '記録に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  return (
    <main>
      <h1>{vehicle.name} の車検完了を記録</h1>
      <ShakenForm
        currentExpiry={vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null}
        submitLabel="車検完了を記録"
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
