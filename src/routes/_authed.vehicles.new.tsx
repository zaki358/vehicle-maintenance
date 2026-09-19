import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { createVehicleFn } from '@/features/vehicles/server/create'
import { VehicleForm } from '@/features/vehicles/vehicle-form'
import type { VehicleFormResult } from '@/features/vehicles/vehicle-form'
import type { VehicleInput } from '@/features/vehicles/lib/vehicle-schema'

export const Route = createFileRoute('/_authed/vehicles/new')({
  component: NewVehiclePage,
})

function NewVehiclePage() {
  const navigate = useNavigate()

  async function handleSubmit(input: VehicleInput): Promise<VehicleFormResult> {
    try {
      const vehicle = await createVehicleFn({ data: input })
      await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
      return { success: true }
    } catch {
      return { success: false, error: '登録に失敗しました。時間をおいて再度お試しください。' }
    }
  }

  return (
    <main>
      <h1>車両を登録</h1>
      <VehicleForm submitLabel="登録" onSubmit={handleSubmit} />
    </main>
  )
}
