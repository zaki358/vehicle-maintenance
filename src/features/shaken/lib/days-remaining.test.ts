import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { daysUntilExpiry } from './days-remaining'

describe('daysUntilExpiry', () => {
  const d = toDateString

  it('満了日が先なら正の日数', () => {
    expect(daysUntilExpiry(d('2026-11-06'), d('2026-09-06'))).toBe(61)
  })

  it('満了日が今日なら0', () => {
    expect(daysUntilExpiry(d('2026-09-06'), d('2026-09-06'))).toBe(0)
  })

  it('満了日を過ぎていたら負の数', () => {
    expect(daysUntilExpiry(d('2026-09-01'), d('2026-09-06'))).toBe(-5)
  })

  it('車検の設定が無い車両（250cc以下のバイク等）は null を返す', () => {
    expect(daysUntilExpiry(null, d('2026-09-06'))).toBeNull()
  })
})
