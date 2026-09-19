import { Link, createFileRoute } from '@tanstack/react-router'

import { listVehiclesFn } from '@/features/vehicles/server/list'
import { vehicleTypeLabel } from '@/features/vehicles/lib/vehicle-type'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'

/**
 * 車両一覧ページ。
 *
 * `loader` で `listVehiclesFn` を呼ぶことで、画面が表示される前に
 * データ取得が終わっている（TanStack Router のローダーはナビゲーション中に並行実行される）。
 */
export const Route = createFileRoute('/_authed/vehicles/')({
  loader: () => listVehiclesFn(),
  component: VehiclesIndexPage,
})

function VehiclesIndexPage() {
  const vehicles = Route.useLoaderData()

  return (
    <main>
      <h1>車両一覧</h1>
      <p>
        <Link to="/vehicles/new">＋ 車両を登録</Link>
      </p>
      {vehicles.length === 0 ? (
        <p>登録された車両はまだありません。</p>
      ) : (
        <ul>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>
                {vehicle.name}（{vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}）
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
