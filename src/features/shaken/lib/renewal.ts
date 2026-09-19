import type { DateString } from '@/lib/date/date-string'
import { isOnOrAfter } from '@/lib/date/date-string'
import { addMonths, addYears } from '@/lib/date/add-months'

/** 車検の有効期間。新規登録・新車初回は3年、それ以降の更新は2年が既定。 */
export type ShakenValidYears = 2 | 3

/** 選択肢としてUIに列挙する際に使う `ShakenValidYears` の全値。 */
export const SHAKEN_VALID_YEARS: readonly ShakenValidYears[] = [2, 3]

export type RenewalInput = {
  /** 車検を受けた日 */
  completedOn: DateString
  /** 更新前の満了日。新規登録（初めて車検情報を設定する）なら null。 */
  currentExpiry: DateString | null
  /** 今回の更新で設定する有効期間 */
  years: ShakenValidYears
}

/**
 * 車検更新後の新しい満了日を計算する。
 *
 * ## 制度上のルール
 *
 * 日本の車検制度には「満了日の1ヶ月前以内に受検すれば、
 * 新しい満了日は『受検日 + N年』ではなく『旧満了日 + N年』になる」
 * という繰り越しルールがある。早めに受検しても損をしない（＝満了日が
 * 前倒しにならない）ための仕組みで、逆に1ヶ月より前に受検すると
 * この繰り越しは適用されず、受検日を起点に数え直される。
 *
 * この関数はその制度をそのまま再現する。
 */
export function computeNextShakenExpiry({ completedOn, currentExpiry, years }: RenewalInput): DateString {
  // 新規登録: 車検情報を初めて設定する場合、繰り越す元の満了日が無い。
  if (currentExpiry === null) {
    return addYears(completedOn, years)
  }

  const oneMonthBeforeExpiry = addMonths(currentExpiry, -1)
  const isWithinCarryForwardWindow =
    isOnOrAfter(completedOn, oneMonthBeforeExpiry) && isOnOrAfter(currentExpiry, completedOn)

  // 満了日の1ヶ月前〜当日の間に受検 = 制度どおりの繰り越し。
  // 旧満了日を起点にするので、早く受検しても満了日が縮まらない。
  if (isWithinCarryForwardWindow) {
    return addYears(currentExpiry, years)
  }

  // それ以外（1ヶ月より前の受検、または期限切れ後の受検）は、
  // 受検日そのものを起点に数え直す。
  return addYears(completedOn, years)
}
