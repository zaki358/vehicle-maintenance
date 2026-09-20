import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/page-header'
import { listVehiclesFn } from '@/features/vehicles/server/list'
import type { VehicleRow } from '@/features/vehicles/server/list'
import { vehicleTypeLabel } from '@/features/vehicles/lib/vehicle-type'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'
import { listAllRecordsFn } from '@/features/maintenance/server/list-all'
import { buildVehicleSummaries } from '@/features/dashboard/lib/build-summary'
import type { SummaryRecord, SummaryVehicle, VehicleSummary } from '@/features/dashboard/lib/build-summary'
import { daysUntilExpiry } from '@/features/shaken/lib/days-remaining'
import { shakenTierMessage } from '@/features/shaken/lib/messages'
import type { DateString } from '@/lib/date/date-string'
import { toDateString } from '@/lib/date/date-string'
import { formatJa } from '@/lib/date/format-ja'
import { todayInJst } from '@/lib/date/jst'

/**
 * ダッシュボード（ログイン後の着地ページ）。
 *
 * 車両一覧（`listVehiclesFn`）と整備記録全件（`listAllRecordsFn`）を並行取得し、
 * Phase 3 で完成済みの純粋関数 `buildVehicleSummaries` に渡して
 * 車両ごとのサマリー（車検アラート段階・現在の走行距離・最終整備日）を組み立てる。
 * DBアクセス・日付処理・表示整形をこのファイルに集約せず、それぞれ
 * サーバー関数／`lib/date`／`dashboard/lib` に委譲するのが Phase 3〜7 一貫した設計。
 */
export const Route = createFileRoute('/_authed/')({
  loader: async () => {
    const [vehicles, records] = await Promise.all([listVehiclesFn(), listAllRecordsFn()])
    return { vehicles, records }
  },
  component: Dashboard,
})

function toSummaryVehicle(row: VehicleRow): SummaryVehicle {
  return {
    id: row.id,
    name: row.name,
    vehicleType: row.vehicle_type as VehicleType,
    shakenExpiryDate: row.shaken_expiry_date ? toDateString(row.shaken_expiry_date) : null,
  }
}

function Dashboard() {
  const { user } = Route.useRouteContext()
  const { vehicles, records } = Route.useLoaderData()

  const today = todayInJst()
  const summaryVehicles = vehicles.map(toSummaryVehicle)
  const summaryRecords: SummaryRecord[] = records.map((row) => ({
    vehicleId: row.vehicle_id,
    performedOn: toDateString(row.performed_on),
    odometerKm: row.odometer_km,
  }))
  const summaries = buildVehicleSummaries(summaryVehicles, summaryRecords, today)
  const expiryByVehicleId = new Map<string, DateString | null>(
    summaryVehicles.map((vehicle) => [vehicle.id, vehicle.shakenExpiryDate]),
  )

  function shakenAlertFor(summary: VehicleSummary) {
    if (summary.shakenTier === 'none') {
      return null
    }
    const expiry = expiryByVehicleId.get(summary.vehicleId) ?? null
    return shakenTierMessage(summary.shakenTier, daysUntilExpiry(expiry, today))
  }

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        actions={
          <Link to="/vehicles/new" className="btn btn-primary">
            車両を登録
          </Link>
        }
      />
      <main className="section section-compact">
        <div className="container">
          <div className="section-head">
            <h2>登録車両</h2>
            <p className="section-head-note">ログイン中: {user.email ?? user.id}</p>
          </div>

          {summaries.length === 0 ? (
            <div className="empty-state">
              <p>車両がまだ登録されていません。</p>
              <Link to="/vehicles/new" className="btn btn-primary">
                最初の車両を登録
              </Link>
            </div>
          ) : (
            <ul className="card-grid">
              {summaries.map((summary) => {
                const alertMessage = shakenAlertFor(summary)
                const isDanger = summary.shakenTier !== 'warning'
                return (
                  <li key={summary.vehicleId} className="card">
                    <h2 className="card-title">
                      <Link to="/vehicles/$vehicleId" params={{ vehicleId: summary.vehicleId }}>
                        {summary.name}
                      </Link>
                    </h2>
                    <div className="card-meta">
                      <span>{vehicleTypeLabel(summary.vehicleType)}</span>
                      {summary.currentOdometerKm != null && (
                        <span>
                          <span className="card-meta-label">走行距離 </span>
                          {summary.currentOdometerKm.toLocaleString()}km
                        </span>
                      )}
                      {summary.lastService && (
                        <span>
                          <span className="card-meta-label">前回整備 </span>
                          {formatJa(summary.lastService.lastPerformedOn)}
                          {/* 先の日付で記録された整備は「-5日前」になってしまうので日数を出さない */}
                          {summary.lastService.daysSince >= 0 && `（${summary.lastService.daysSince}日前）`}
                        </span>
                      )}
                    </div>
                    {alertMessage && (
                      <p
                        role={summary.shakenTier === 'warning' ? 'status' : 'alert'}
                        className={`card-alert ${isDanger ? 'card-alert-danger' : 'card-alert-warning'}`}
                      >
                        {alertMessage}{' '}
                        <Link
                          to="/vehicles/$vehicleId/records/new"
                          params={{ vehicleId: summary.vehicleId }}
                          search={{ workType: 'shaken' }}
                        >
                          車検完了を記録
                        </Link>
                      </p>
                    )}
                    <div className="card-actions">
                      <Link
                        to="/vehicles/$vehicleId/records/new"
                        params={{ vehicleId: summary.vehicleId }}
                        className="btn btn-secondary"
                      >
                        整備を記録
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
