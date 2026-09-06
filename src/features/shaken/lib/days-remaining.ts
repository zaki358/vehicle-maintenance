import type { DateString } from '@/lib/date/date-string'
import { daysBetween } from '@/lib/date/date-string'

/**
 * 車検満了日までの残り日数を計算する。
 *
 * @param expiry - 車検満了日。250cc以下のバイクなど車検制度の対象外の車両では
 *   満了日そのものが存在しないため `null` になりうる。
 * @param today - 基準となる「今日」。呼び出し側が `todayInJst()` などで
 *   明示的に渡す想定（この関数自身は現在時刻を知らない）。
 * @returns 残り日数。0 なら本日が満了日、負の数なら期限切れ。
 *   `expiry` が `null` なら、そもそも車検の概念が無いので `null` を返す
 *   （0日や期限切れとして扱ってアラートを出さないための区別）。
 */
export function daysUntilExpiry(expiry: DateString | null, today: DateString): number | null {
  if (expiry === null) {
    return null
  }
  return daysBetween(today, expiry)
}
