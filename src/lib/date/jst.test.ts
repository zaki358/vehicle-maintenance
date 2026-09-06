import { describe, expect, it } from 'vitest'

import { todayInJst } from './jst'

describe('todayInJst', () => {
  it('UTC 深夜0時ちょうどは JST では既に翌日の朝9時', () => {
    // 2026-09-06T00:00:00Z は JST で 2026-09-06 09:00
    const now = new Date('2026-09-06T00:00:00.000Z')
    expect(todayInJst(now)).toBe('2026-09-06')
  })

  it('UTC 前日15:00 は JST で当日00:00（日付が変わる境界の下限）', () => {
    // 2026-09-05T15:00:00Z = JST 2026-09-06T00:00:00
    const now = new Date('2026-09-05T15:00:00.000Z')
    expect(todayInJst(now)).toBe('2026-09-06')
  })

  it('UTC 前日14:59:59.999 は JST でまだ前日（境界の直前）', () => {
    const now = new Date('2026-09-05T14:59:59.999Z')
    expect(todayInJst(now)).toBe('2026-09-05')
  })

  it('UTC ベースの日付切り出しでは壊れるケース（本題）', () => {
    // JST 2026-09-06 00:30 の瞬間、UTC はまだ 2026-09-05 15:30。
    // もし実装が `now.toISOString().slice(0, 10)` のように UTC の日付を
    // そのまま使っていたら、この瞬間の「今日」は誤って '2026-09-05' になる。
    // 正しくは JST で考えて '2026-09-06'。
    const jstJustAfterMidnight = new Date('2026-09-05T15:30:00.000Z')
    expect(todayInJst(jstJustAfterMidnight)).toBe('2026-09-06')
  })

  it('年またぎでも正しい（大晦日 → 元日）', () => {
    // JST 2027-01-01 00:00 = UTC 2026-12-31 15:00
    const now = new Date('2026-12-31T15:00:00.000Z')
    expect(todayInJst(now)).toBe('2027-01-01')
  })

  it('うるう年の2月29日をまたぐ', () => {
    // JST 2024-02-29 00:00 = UTC 2024-02-28 15:00
    const now = new Date('2024-02-28T15:00:00.000Z')
    expect(todayInJst(now)).toBe('2024-02-29')
  })

  it('引数を省略すると現在時刻を使う（呼び出せることだけ確認）', () => {
    const result = todayInJst()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('返り値は DateString として比較・演算にそのまま使える形式', () => {
    const result = todayInJst(new Date('2026-09-06T00:00:00.000Z'))
    // ゼロ埋め4桁の年、2桁の月日であること
    expect(result).toBe('2026-09-06')
    expect(result.length).toBe(10)
  })
})
