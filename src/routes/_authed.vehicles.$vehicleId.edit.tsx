import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { updateVehicleFn } from '@/features/vehicles/server/update'
import { VehicleForm } from '@/features/vehicles/vehicle-form'
import type { VehicleFormResult } from '@/features/vehicles/vehicle-form'
import type { VehicleInput } from '@/features/vehicles/lib/vehicle-schema'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'
import { toDateString } from '@/lib/date/date-string'

export const Route = createFileRoute('/_authed/vehicles/$vehicleId/edit')({
  component: EditVehiclePage,
})

function EditVehiclePage() {
  const { vehicle } = Route.useRouteContext()
  const navigate = useNavigate()

  const initialValues: VehicleInput = {
    name: vehicle.name,
    modelCode: vehicle.model_code,
    vehicleType: vehicle.vehicle_type as VehicleType,
    shakenExpiryDate: vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null,
    note: vehicle.note,
  }

  async function handleSubmit(input: VehicleInput): Promise<VehicleFormResult> {
    try {
      const updated = await updateVehicleFn({ data: { id: vehicle.id, ...input } })
      if (!updated) {
        return { success: false, error: '更新に失敗しました。車両が見つかりませんでした。' }
      }
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '更新に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  return (
    <>
      <PageHeader title={`${vehicle.name} を編集`} />
      <main className="section section-compact">
        <div className="container container-narrow stack">
          <div className="card">
            <VehicleForm submitLabel="更新" initialValues={initialValues} onSubmit={handleSubmit} />
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
