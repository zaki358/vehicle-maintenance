import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { deleteVehicleFn } from '@/features/vehicles/server/delete'
import { vehicleTypeLabel } from '@/features/vehicles/lib/vehicle-type'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'
import { toDateString } from '@/lib/date/date-string'
import { formatJa } from '@/lib/date/format-ja'

export const Route = createFileRoute('/_authed/vehicles/$vehicleId/')({
  component: VehicleDetailPage,
})

function VehicleDetailPage() {
  const { vehicle } = Route.useRouteContext()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(`「${vehicle.name}」を削除します。整備記録も全て削除されます。よろしいですか？`)
    if (!confirmed) {
      return
    }
    setDeleting(true)
    try {
      await deleteVehicleFn({ data: { id: vehicle.id } })
      await navigate({ to: '/vehicles' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main>
      <h1>{vehicle.name}</h1>
      <p>車両区分: {vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}</p>
      <p>
        車検満了日:{' '}
        {vehicle.shaken_expiry_date ? formatJa(toDateString(vehicle.shaken_expiry_date)) : '車検対象外'}
      </p>
      {vehicle.note && <p>備考: {vehicle.note}</p>}
      <p>
        <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId: vehicle.id }}>
          編集
        </Link>
      </p>
      <button type="button" onClick={handleDelete} disabled={deleting}>
        削除
      </button>
      <p>
        <Link to="/vehicles">車両一覧へ戻る</Link>
      </p>
    </main>
  )
}
