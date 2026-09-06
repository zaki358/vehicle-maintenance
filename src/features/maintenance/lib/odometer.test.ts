import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { isOdometerRegression } from './odometer'

describe('isOdometerRegression', () => {
  it('他の記録が無ければ逆行ではない', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 10000 }
    expect(isOdometerRegression(candidate, [])).toBe(false)
  })

  it('過去の記録より走行距離が増えていれば逆行ではない', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 15000 }
    const others = [{ performedOn: toDateString('2026-01-01'), odometerKm: 10000 }]
    expect(isOdometerRegression(candidate, others)).toBe(false)
  })

  it('過去の記録より走行距離が減っていれば逆行', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 9000 }
    const others = [{ performedOn: toDateString('2026-01-01'), odometerKm: 10000 }]
    expect(isOdometerRegression(candidate, others)).toBe(true)
  })

  it('同日の記録より走行距離が少なくても逆行', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 9000 }
    const others = [{ performedOn: toDateString('2026-06-01'), odometerKm: 10000 }]
    expect(isOdometerRegression(candidate, others)).toBe(true)
  })

  it('未来の記録より走行距離が多ければ逆行(未来の記録の方が少ない=矛盾)', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 20000 }
    const others = [{ performedOn: toDateString('2026-09-01'), odometerKm: 15000 }]
    expect(isOdometerRegression(candidate, others)).toBe(true)
  })

  it('未来の記録の方が走行距離が多ければ逆行ではない', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 10000 }
    const others = [{ performedOn: toDateString('2026-09-01'), odometerKm: 15000 }]
    expect(isOdometerRegression(candidate, others)).toBe(false)
  })

  it('同日・同じ走行距離は逆行ではない(自分自身を除いた比較を想定)', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 10000 }
    const others = [{ performedOn: toDateString('2026-06-01'), odometerKm: 10000 }]
    expect(isOdometerRegression(candidate, others)).toBe(false)
  })

  it('複数の記録のうち1件でも矛盾すれば逆行', () => {
    const candidate = { performedOn: toDateString('2026-06-01'), odometerKm: 12000 }
    const others = [
      { performedOn: toDateString('2026-01-01'), odometerKm: 10000 },
      { performedOn: toDateString('2026-03-01'), odometerKm: 13000 },
    ]
    expect(isOdometerRegression(candidate, others)).toBe(true)
  })
})
