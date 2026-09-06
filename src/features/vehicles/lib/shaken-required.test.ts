import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { shakenRequired } from './shaken-required'

describe('shakenRequired', () => {
  it('満了日が null（250cc以下のバイク等）なら車検UIの対象外', () => {
    expect(shakenRequired(null)).toBe(false)
  })

  it('満了日が設定されていれば車検UIの対象', () => {
    expect(shakenRequired(toDateString('2026-09-06'))).toBe(true)
  })
})
