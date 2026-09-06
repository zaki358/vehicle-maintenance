import type { DateString } from '@/lib/date/date-string'
import { isOnOrAfter } from '@/lib/date/date-string'
import { addMonths } from '@/lib/date/add-months'

/**
 * 車検アラートの段階。
 *
 * - `none`    — アラート不要（満了日が無い車両、または十分に先）
 * - `warning` — 残り2ヶ月以内（黄色系の注意表示）
 * - `danger`  — 残り1ヶ月以内（赤系の強い警告）
 * - `expired` — 満了日を過ぎている
 */
export type ShakenAlertTier = 'none' | 'warning' | 'danger' | 'expired'

/**
 * 満了日と今日から、表示すべきアラートの段階を判定する。
 *
 * ## 「暦月」で判定する理由
 *
 * 要件は「2ヶ月前」「1ヶ月前」であり、これは日本語話者が読んだときに
 * カレンダー上の月を指す。30日・60日という日数ベースの近似にすると、
 * 31日ある月をまたぐ満了日では1日早く、または遅くアラートが出てしまう。
 * そのため `addMonths` でカレンダー上の1ヶ月前・2ヶ月前を直接計算する。
 *
 * ## 判定式について
 *
 * 「今日が『満了日のNヶ月前』以降になったか」を、文字列の日付比較
 * （`isOnOrAfter`）でそのまま判定できる。これは date-string.ts の
 * `DateString` が `YYYY-MM-DD` のゼロ埋め形式を保証しているため、
 * 辞書順比較が日付の前後関係と一致するからこそ成立する。
 *
 * 判定は「期限切れ」→「危険」→「警告」の順、範囲の広いものから狭いものへと
 * 絞り込む形にしている。満了日当日は `today > expiry` が偽になるため
 * 期限切れには分類されず、danger（残り1ヶ月以内）に含まれる。
 */
export function shakenAlertTier(expiry: DateString | null, today: DateString): ShakenAlertTier {
  if (expiry === null) {
    return 'none'
  }

  if (today > expiry) {
    return 'expired'
  }

  if (isOnOrAfter(today, addMonths(expiry, -1))) {
    return 'danger'
  }

  if (isOnOrAfter(today, addMonths(expiry, -2))) {
    return 'warning'
  }

  return 'none'
}
