import { describe, expect, it } from 'vitest'

import { toDateString } from './date-string'
import { formatJa, formatJaShort } from './format-ja'

describe('formatJa', () => {
  it('年月日と曜日を日本語で表示する', () => {
    // 2026-09-06 は日曜日
    expect(formatJa(toDateString('2026-09-06'))).toBe('2026年9月6日(日)')
  })

  it('月日が1桁でもゼロ埋めしない（日本語表記の慣習）', () => {
    // 2026-01-05 は月曜日
    expect(formatJa(toDateString('2026-01-05'))).toBe('2026年1月5日(月)')
  })

  it('曜日が一巡する7日間をすべて確認する', () => {
    // 2026-09-06(日) を起点に1週間
    expect(formatJa(toDateString('2026-09-06'))).toContain('(日)')
    expect(formatJa(toDateString('2026-09-07'))).toContain('(月)')
    expect(formatJa(toDateString('2026-09-08'))).toContain('(火)')
    expect(formatJa(toDateString('2026-09-09'))).toContain('(水)')
    expect(formatJa(toDateString('2026-09-10'))).toContain('(木)')
    expect(formatJa(toDateString('2026-09-11'))).toContain('(金)')
    expect(formatJa(toDateString('2026-09-12'))).toContain('(土)')
  })
})

describe('formatJaShort', () => {
  it('月と日だけを短く表示する（一覧表示向け）', () => {
    expect(formatJaShort(toDateString('2026-09-06'))).toBe('9/6')
  })

  it('1桁の月日はゼロ埋めしない', () => {
    expect(formatJaShort(toDateString('2026-01-05'))).toBe('1/5')
  })

  it('12月31日も正しく表示する', () => {
    expect(formatJaShort(toDateString('2026-12-31'))).toBe('12/31')
  })
})
