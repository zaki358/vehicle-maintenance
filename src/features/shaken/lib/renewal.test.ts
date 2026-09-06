import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { computeNextShakenExpiry } from './renewal'

describe('computeNextShakenExpiry', () => {
  const d = toDateString

  describe('新規登録（currentExpiry が null）', () => {
    it('受検日から N年後になる', () => {
      expect(
        computeNextShakenExpiry({ completedOn: d('2026-09-06'), currentExpiry: null, years: 2 }),
      ).toBe(d('2028-09-06'))
    })

    it('新車初回（3年）にも対応する', () => {
      expect(
        computeNextShakenExpiry({ completedOn: d('2026-09-06'), currentExpiry: null, years: 3 }),
      ).toBe(d('2029-09-06'))
    })
  })

  describe('制度どおりの繰り越し（満了日の1ヶ月前以内の受検）', () => {
    it('満了日ちょうど1ヶ月前に受検 → 旧満了日 + N年（日付が前倒しにならない）', () => {
      // 旧満了日 2026-11-30、1ヶ月前 = 2026-10-30
      const result = computeNextShakenExpiry({
        completedOn: d('2026-10-30'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-11-30'))
    })

    it('満了日の2週間前に受検（1ヶ月前より後）→ 旧満了日 + N年', () => {
      const result = computeNextShakenExpiry({
        completedOn: d('2026-11-16'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-11-30'))
    })

    it('満了日当日に受検 → 旧満了日 + N年', () => {
      const result = computeNextShakenExpiry({
        completedOn: d('2026-11-30'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-11-30'))
    })
  })

  describe('繰り越しの対象外: 早すぎる受検（1ヶ月前より前）', () => {
    it('満了日の1ヶ月と1日前に受検 → 受検日 + N年（繰り越し失効）', () => {
      // 1ヶ月前(2026-10-30)の前日
      const result = computeNextShakenExpiry({
        completedOn: d('2026-10-29'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-10-29'))
    })

    it('半年前に受検 → 受検日 + N年', () => {
      const result = computeNextShakenExpiry({
        completedOn: d('2026-05-30'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-05-30'))
    })
  })

  describe('繰り越しの対象外: 期限切れ後の受検', () => {
    it('満了日の翌日に受検 → 受検日 + N年', () => {
      const result = computeNextShakenExpiry({
        completedOn: d('2026-12-01'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2028-12-01'))
    })

    it('満了日から半年以上過ぎて受検 → 受検日 + N年', () => {
      const result = computeNextShakenExpiry({
        completedOn: d('2027-06-15'),
        currentExpiry: d('2026-11-30'),
        years: 2,
      })
      expect(result).toBe(d('2029-06-15'))
    })
  })

  it('新車初回3年からの2回目更新（2年）も正しく計算できる', () => {
    // 1回目: 新規登録で3年後の満了日が既に設定されている状態から、
    // 2回目の車検（今度は2年更新）を、制度どおり1ヶ月前に受検した場合
    const result = computeNextShakenExpiry({
      completedOn: d('2029-08-10'),
      currentExpiry: d('2029-09-06'),
      years: 2,
    })
    expect(result).toBe(d('2031-09-06'))
  })
})
