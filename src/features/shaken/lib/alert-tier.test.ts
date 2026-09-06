import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { shakenAlertTier } from './alert-tier'

describe('shakenAlertTier', () => {
  const d = toDateString

  it('満了日が無い車両（250cc以下のバイク等）は常に none', () => {
    expect(shakenAlertTier(null, d('2026-09-06'))).toBe('none')
  })

  it('満了日の2ヶ月より前は none', () => {
    // 満了日 2026-11-30、今日 2026-09-29（2ヶ月前の1日前）
    expect(shakenAlertTier(d('2026-11-30'), d('2026-09-29'))).toBe('none')
  })

  describe('warning: 満了日の2ヶ月前ちょうど〜1ヶ月前の前日まで', () => {
    it('満了日の2ヶ月前ちょうどは warning', () => {
      // 2026-11-30 の2ヶ月前 = 2026-09-30
      expect(shakenAlertTier(d('2026-11-30'), d('2026-09-30'))).toBe('warning')
    })

    it('2ヶ月前と1ヶ月前の間は warning', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2026-10-15'))).toBe('warning')
    })

    it('1ヶ月前の前日は warning', () => {
      // 2026-11-30 の1ヶ月前 = 2026-10-30 なので、その前日 10-29 はまだ warning
      expect(shakenAlertTier(d('2026-11-30'), d('2026-10-29'))).toBe('warning')
    })
  })

  describe('danger: 満了日の1ヶ月前ちょうど〜満了日当日まで', () => {
    it('満了日の1ヶ月前ちょうどは danger', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2026-10-30'))).toBe('danger')
    })

    it('1ヶ月前と満了日の間は danger', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2026-11-15'))).toBe('danger')
    })

    it('満了日当日は danger（まだ期限切れではない）', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2026-11-30'))).toBe('danger')
    })
  })

  describe('expired: 満了日を過ぎたら', () => {
    it('満了日の翌日は expired', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2026-12-01'))).toBe('expired')
    })

    it('大きく過ぎていても expired', () => {
      expect(shakenAlertTier(d('2026-11-30'), d('2027-06-01'))).toBe('expired')
    })
  })

  describe('境界値: 月末満了日での月またぎ（addMonthsのクランプが影響する）', () => {
    it('1月31日満了 → 2ヶ月前は11月30日相当（クランプ）で判定される', () => {
      // addMonths('2026-01-31', -2) は 11月に31日が無いため 2025-11-30 になる
      expect(shakenAlertTier(d('2026-01-31'), d('2025-11-30'))).toBe('warning')
      expect(shakenAlertTier(d('2026-01-31'), d('2025-11-29'))).toBe('none')
    })
  })

  it('実運用の例: 満了日まで残り55日はwarning、20日はdanger', () => {
    // 今日を 2026-09-06 に固定し、満了日を逆算する
    const today = d('2026-09-06')
    // 55日後 ≈ 2026-10-31 だが、月境界の影響を避けるため直接指定する
    expect(shakenAlertTier(d('2026-10-31'), today)).toBe('warning')
    // 20日後 = 2026-09-26
    expect(shakenAlertTier(d('2026-09-26'), today)).toBe('danger')
  })
})
