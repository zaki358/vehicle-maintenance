import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { logoutFn } from '@/features/auth/server/logout'
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
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()
  const { vehicles, records } = Route.useLoaderData()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logoutFn()
      await navigate({ to: '/login', replace: true })
    } catch {
      setLogoutError('ログアウトに失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoggingOut(false)
    }
  }

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
    <main>
      <h1>車両メンテナンス記録</h1>
      <p>ログイン中: {user.email ?? user.id}</p>
      <button type="button" onClick={handleLogout} disabled={loggingOut}>
        ログアウト
      </button>
      {logoutError && <p role="alert">{logoutError}</p>}

      <p>
        <Link to="/vehicles/new">＋ 車両を登録</Link>
      </p>

      {summaries.length === 0 ? (
        <p>車両がまだ登録されていません。</p>
      ) : (
        <ul>
          {summaries.map((summary) => {
            const alertMessage = shakenAlertFor(summary)
            return (
              <li key={summary.vehicleId}>
                <Link to="/vehicles/$vehicleId" params={{ vehicleId: summary.vehicleId }}>
                  {summary.name}
                </Link>
                ・{vehicleTypeLabel(summary.vehicleType)}
                {summary.currentOdometerKm != null && `・${summary.currentOdometerKm}km`}
                {summary.lastService &&
                  `・前回整備: ${formatJa(summary.lastService.lastPerformedOn)}（${summary.lastService.daysSince}日前）`}
                {alertMessage && (
                  <p role={summary.shakenTier === 'warning' ? 'status' : 'alert'}>
                    {alertMessage}{' '}
                    <Link to="/vehicles/$vehicleId/shaken" params={{ vehicleId: summary.vehicleId }}>
                      車検完了を記録
                    </Link>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p>
        <Link to="/vehicles">車両一覧へ</Link>
      </p>
    </main>
  )
}
