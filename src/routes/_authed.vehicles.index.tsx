import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
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
    <>
      <PageHeader
        title="車両"
        actions={
          <Link to="/vehicles/new" className="btn btn-primary">
            車両を登録
          </Link>
        }
      />
      <main className="section section-compact">
        <div className="container">
          {vehicles.length === 0 ? (
            <div className="empty-state">
              <p>登録された車両はまだありません。</p>
              <Link to="/vehicles/new" className="btn btn-primary">
                最初の車両を登録
              </Link>
            </div>
          ) : (
            <ul className="card-grid">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id} className="card">
                  <h2 className="card-title">
                    <Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>
                      {vehicle.name}
                    </Link>
                  </h2>
                  <div className="card-meta">
                    <span>{vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}</span>
                    {vehicle.model_code && <span>{vehicle.model_code}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
