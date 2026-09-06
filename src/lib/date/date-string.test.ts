import { describe, expect, it } from 'vitest'

import {
  daysBetween,
  isDateString,
  isOnOrAfter,
  isOnOrBefore,
  toDateString,
  toUtcMillis,
} from './date-string'

describe('isDateString', () => {
  it.each([
    ['2026-09-06', true],
    ['2000-01-01', true],
    ['2024-02-29', true], // 2024 はうるう年
    ['9999-12-31', true],
  ])('%s は正しい日付文字列として受け入れる', (input, expected) => {
    expect(isDateString(input)).toBe(expected)
  })

  it.each([
    ['', '空文字'],
    ['2026-9-6', 'ゼロ埋めされていない'],
    ['2026/09/06', 'スラッシュ区切り'],
    ['26-09-06', '年が2桁'],
    ['2026-09-06T00:00:00Z', '時刻が付いている'],
    ['2026-13-01', '13月は存在しない'],
    ['2026-00-01', '0月は存在しない'],
    ['2026-09-31', '9月31日は存在しない'],
    ['2026-02-29', '2026 はうるう年ではない'],
    ['2026-02-30', '2月30日は存在しない'],
    ['abcd-ef-gh', '数字ですらない'],
  ])('%s は拒否する（%s）', (input) => {
    expect(isDateString(input)).toBe(false)
  })
})

describe('toDateString', () => {
  it('正しい文字列はそのまま返す', () => {
    expect(toDateString('2026-09-06')).toBe('2026-09-06')
  })

  it('不正な文字列は例外を投げる（黙って握りつぶさない）', () => {
    expect(() => toDateString('2026-02-30')).toThrow(/2026-02-30/)
  })
})

describe('toUtcMillis', () => {
  it('UTC 深夜0時のミリ秒を返す', () => {
    expect(toUtcMillis(toDateString('1970-01-01'))).toBe(0)
    expect(toUtcMillis(toDateString('1970-01-02'))).toBe(86_400_000)
  })

  it('0〜99 年も 1900 年代に写されない', () => {
    // Date.UTC(26, 0, 1) は 1926年になってしまう仕様。補正が効いているか。
    const ms = toUtcMillis(toDateString('0026-01-01'))
    expect(new Date(ms).getUTCFullYear()).toBe(26)
  })

  it('ホスト側のタイムゾーンに影響されない', () => {
    // Date.UTC を使うので、実行環境が UTC でも JST でも同じ値になる。
    // Workers は常に UTC、利用者の端末は JST という食い違いを吸収する要。
    const a = toUtcMillis(toDateString('2026-09-06'))
    const b = Date.UTC(2026, 8, 6)
    expect(a).toBe(b)
  })
})

describe('daysBetween', () => {
  const d = toDateString

  it.each([
    ['2026-09-06', '2026-09-06', 0, '同じ日'],
    ['2026-09-06', '2026-09-07', 1, '翌日'],
    ['2026-09-07', '2026-09-06', -1, '前日は負の数'],
    ['2026-09-01', '2026-10-01', 30, '9月は30日'],
    ['2026-01-01', '2026-02-01', 31, '1月は31日'],
    ['2026-01-01', '2027-01-01', 365, '平年は365日'],
    ['2024-01-01', '2025-01-01', 366, 'うるう年は366日'],
    ['2024-02-28', '2024-03-01', 2, 'うるう年の2月をまたぐ'],
    ['2026-02-28', '2026-03-01', 1, '平年の2月をまたぐ'],
  ])('%s → %s は %d 日（%s）', (from, to, expected) => {
    expect(daysBetween(d(from), d(to))).toBe(expected)
  })

  it('車検満了日までの残り日数として使える', () => {
    // 「今日」が 2026-09-06、満了日が 2026-11-06 なら残り 61 日
    expect(daysBetween(d('2026-09-06'), d('2026-11-06'))).toBe(61)
  })

  it('期限切れは負の数になる', () => {
    expect(daysBetween(d('2026-09-06'), d('2026-09-01'))).toBe(-5)
  })
})

describe('比較関数', () => {
  const d = toDateString

  it('isOnOrAfter は同日を含めて以降なら true', () => {
    expect(isOnOrAfter(d('2026-09-06'), d('2026-09-06'))).toBe(true)
    expect(isOnOrAfter(d('2026-09-07'), d('2026-09-06'))).toBe(true)
    expect(isOnOrAfter(d('2026-09-05'), d('2026-09-06'))).toBe(false)
  })

  it('isOnOrBefore は同日を含めて以前なら true', () => {
    expect(isOnOrBefore(d('2026-09-06'), d('2026-09-06'))).toBe(true)
    expect(isOnOrBefore(d('2026-09-05'), d('2026-09-06'))).toBe(true)
    expect(isOnOrBefore(d('2026-09-07'), d('2026-09-06'))).toBe(false)
  })

  it('年をまたいでも桁数に惑わされない', () => {
    // 辞書順比較が使えるのはゼロ埋めが保証されているから
    expect(isOnOrAfter(d('2026-01-01'), d('2025-12-31'))).toBe(true)
    expect(isOnOrBefore(d('2025-12-31'), d('2026-01-01'))).toBe(true)
  })
})
