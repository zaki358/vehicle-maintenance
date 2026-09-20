import { Link, Outlet, createFileRoute, notFound } from '@tanstack/react-router'

import { getVehicleFn } from '@/features/vehicles/server/get'

/**
 * `/vehicles/$vehicleId` 配下をまとめるレイアウトルート。
 *
 * `_authed.tsx` が「ログイン中の user」を context に積んだのと同じやり方で、
 * ここでは「対象の車両」を取得して context に積む。子ルート（詳細・編集）は
 * 個別に `getVehicleFn` を呼び直す必要がなく、`Route.useRouteContext()` で
 * `vehicle` を受け取るだけでよい。
 *
 * 存在しない ID と、他人の車両の ID（RLS がブロックする）は
 * `getVehicleFn` の時点で区別せず両方 `null` になるため、ここでの扱いも
 * 同じ `notFound()` で統一する。B が A の車両 URL を直接叩いても、
 * 「他人の車両がある」という情報は一切漏れない。
 */
export const Route = createFileRoute('/_authed/vehicles/$vehicleId')({
  beforeLoad: async ({ params }) => {
    const vehicle = await getVehicleFn({ data: { id: params.vehicleId } })
    if (!vehicle) {
      throw notFound()
    }
    return { vehicle }
  },
  notFoundComponent: VehicleNotFound,
  component: () => <Outlet />,
})

function VehicleNotFound() {
  return (
    <main className="section section-compact">
      <div className="container container-narrow">
        <div className="empty-state">
          <h1>車両が見つかりません</h1>
          <p>指定された車両は存在しないか、閲覧できません。</p>
          <Link to="/vehicles" className="btn btn-secondary">
            車両一覧へ戻る
          </Link>
        </div>
      </div>
    </main>
  )
}
