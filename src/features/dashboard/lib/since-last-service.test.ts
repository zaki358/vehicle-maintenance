import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { sinceLastService } from './since-last-service'

describe('sinceLastService', () => {
  it('記録が0件なら null を返す', () => {
    expect(sinceLastService([], toDateString('2026-09-06'))).toBeNull()
  })

  it('記録が1件なら、その実施日と今日までの日数を返す', () => {
    const result = sinceLastService(
      [{ performedOn: toDateString('2026-08-01') }],
      toDateString('2026-09-06'),
    )

    expect(result).toEqual({
      lastPerformedOn: toDateString('2026-08-01'),
      daysSince: 36,
    })
  })

  it('複数件ある場合、日付の並び順に関わらず最新の実施日を選ぶ', () => {
    const result = sinceLastService(
      [
        { performedOn: toDateString('2026-01-01') },
        { performedOn: toDateString('2026-03-01') },
        { performedOn: toDateString('2026-02-01') },
      ],
      toDateString('2026-03-15'),
    )

    expect(result).toEqual({
      lastPerformedOn: toDateString('2026-03-01'),
      daysSince: 14,
    })
  })

  it('最新の実施日が複数件あっても、その日付を返す', () => {
    const result = sinceLastService(
      [
        { performedOn: toDateString('2026-03-01') },
        { performedOn: toDateString('2026-03-01') },
      ],
      toDateString('2026-03-01'),
    )

    expect(result).toEqual({
      lastPerformedOn: toDateString('2026-03-01'),
      daysSince: 0,
    })
  })
})
