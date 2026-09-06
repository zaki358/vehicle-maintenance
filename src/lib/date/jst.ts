import type { DateString } from './date-string'
import { toDateString } from './date-string'

/**
 * 利用者にとっての「今日」を、日本時間（Asia/Tokyo, UTC+9）基準で求める。
 *
 * ## なぜこれが要るのか
 *
 * Cloudflare Workers の実行環境は常に UTC で動く。一方、このアプリの利用者は
 * 日本にいて、端末は JST。UTC と JST には 9 時間の差があるため、
 * 毎日 00:00〜09:00 JST の間は「UTC で見た日付」と「JST で見た日付」が
 * 1 日ずれる（UTC がまだ前日）。
 *
 * サーバー側で `new Date().toISOString().slice(0, 10)` のように
 * 安易に「今日」を求めると、この 9 時間は 1 日古い日付になり、
 * 車検の残り日数がクライアント側の計算と食い違う。
 *
 * `Intl.DateTimeFormat` にタイムゾーンを明示すれば、実行環境が UTC でも
 * JST でも常に同じ「日本時間での今日」が得られる。
 */

const JST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 日本時間で見た「今日」を `YYYY-MM-DD` で返す。
 *
 * @param now - 基準となる時刻。省略時は現在時刻。
 *   引数として注入できるようにしているのが要点で、これによって
 *   テストが実行環境の現在時刻に依存せず、決まった時刻での挙動を検証できる。
 */
export function todayInJst(now: Date = new Date()): DateString {
  // en-CA ロケールの日付フォーマットは "YYYY-MM-DD" になる。
  // これは実装の都合であって偶然ではなく、この形式が DateString の
  // 期待する形式とちょうど一致するために選んでいる。
  return toDateString(JST_FORMATTER.format(now))
}
