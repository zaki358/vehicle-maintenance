import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { buildVehicleSummaries, buildVehicleSummary } from './build-summary'

const TODAY = toDateString('2026-09-06')

describe('buildVehicleSummary', () => {
  it('記録が無い車両は、走行距離・直近整備ともに null になる', () => {
    const summary = buildVehicleSummary(
      { id: 'v1', name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null },
      [],
      TODAY,
    )

    expect(summary).toEqual({
      vehicleId: 'v1',
      name: 'カブ',
      vehicleType: 'motorcycle',
      shakenTier: 'none',
      currentOdometerKm: null,
      lastService: null,
    })
  })

  it('走行距離の記録があれば、最大値を現在の走行距離とする', () => {
    const summary = buildVehicleSummary(
      { id: 'v1', name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null },
      [
        { vehicleId: 'v1', performedOn: toDateString('2026-01-10'), odometerKm: 5000 },
        { vehicleId: 'v1', performedOn: toDateString('2026-06-01'), odometerKm: 8000 },
      ],
      TODAY,
    )

    expect(summary.currentOdometerKm).toBe(8000)
    expect(summary.lastService).toEqual({
      lastPerformedOn: toDateString('2026-06-01'),
      daysSince: 97,
    })
  })

  it('走行距離が未入力（null）の記録は現在の走行距離の計算から除外する', () => {
    const summary = buildVehicleSummary(
      { id: 'v1', name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null },
      [{ vehicleId: 'v1', performedOn: toDateString('2026-01-10'), odometerKm: null }],
      TODAY,
    )

    expect(summary.currentOdometerKm).toBeNull()
  })

  it('他の車両の記録は集計に含めない', () => {
    const summary = buildVehicleSummary(
      { id: 'v1', name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null },
      [{ vehicleId: 'v2', performedOn: toDateString('2026-08-01'), odometerKm: 99999 }],
      TODAY,
    )

    expect(summary.currentOdometerKm).toBeNull()
    expect(summary.lastService).toBeNull()
  })

  it('車検満了日から shakenTier を判定する', () => {
    const summary = buildVehicleSummary(
      { id: 'v1', name: 'ワゴンR', vehicleType: 'car', shakenExpiryDate: toDateString('2026-08-01') },
      [],
      TODAY,
    )

    expect(summary.shakenTier).toBe('expired')
  })
})

describe('buildVehicleSummaries', () => {
  it('複数の車両それぞれのサマリーを配列で返す', () => {
    const summaries = buildVehicleSummaries(
      [
        { id: 'v1', name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null },
        { id: 'v2', name: 'ワゴンR', vehicleType: 'car', shakenExpiryDate: toDateString('2026-08-01') },
      ],
      [{ vehicleId: 'v1', performedOn: toDateString('2026-06-01'), odometerKm: 8000 }],
      TODAY,
    )

    expect(summaries).toHaveLength(2)
    expect(summaries[0].vehicleId).toBe('v1')
    expect(summaries[0].currentOdometerKm).toBe(8000)
    expect(summaries[1].vehicleId).toBe('v2')
    expect(summaries[1].shakenTier).toBe('expired')
  })
})
