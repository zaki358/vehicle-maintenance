import { describe, expect, it } from 'vitest'

import { dateStringSchema } from './date-string-schema'

describe('dateStringSchema', () => {
  it('YYYY-MM-DD 形式の実在する日付を受理する', () => {
    const result = dateStringSchema.safeParse('2026-09-06')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('2026-09-06')
    }
  })

  it('スラッシュ区切りなど不正な形式は拒否する', () => {
    expect(dateStringSchema.safeParse('2026/09/06').success).toBe(false)
  })

  it('実在しない日付（2月30日）は拒否する', () => {
    expect(dateStringSchema.safeParse('2026-02-30').success).toBe(false)
  })

  it('うるう年でない年の2月29日は拒否する', () => {
    expect(dateStringSchema.safeParse('2026-02-29').success).toBe(false)
  })
})
