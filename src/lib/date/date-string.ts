/**
 * 「日付だけ」を安全に扱うための型と演算。
 *
 * ## なぜ Date を使わないのか
 *
 * このアプリは Cloudflare Workers 上で動く。Workers のタイムゾーンは常に UTC で、
 * 利用者の端末は JST（UTC+9）。つまり毎日 00:00〜09:00 JST の 9 時間は、
 * サーバーが考える「今日」と利用者が考える「今日」が 1 日ずれる。
 *
 * さらに `new Date('2026-09-06')` は仕様上 UTC 深夜0時として解釈されるため、
 * `toLocaleDateString()` で表示すると環境によって前日が出る。
 *
 * この 2 つが噛み合うと、「車検まであと 31 日」がサーバー描画では 31 日、
 * ハイドレーション後に 30 日へ化ける。React は警告を出さないので気づけない。
 *
 * 対策として、この層では **Date インスタンスを一切作らず**、
 * `YYYY-MM-DD` の文字列と整数演算だけでカレンダー計算を行う。
 * 表示用の整形（「2026年9月6日(土)」）だけは format-ja.ts に隔離する。
 */

/**
 * `YYYY-MM-DD` 形式であることが検証済みの日付文字列。
 *
 * ただの string ではなくブランド型にしているのは、
 * 未検証の文字列がそのまま計算に流れ込むのを型で止めるため。
 * ゼロ埋めが保証されるので、辞書順比較がそのまま日付比較として使える。
 */
export type DateString = string & { readonly __brand: 'DateString' }

const PATTERN = /^\d{4}-\d{2}-\d{2}$/

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

const MILLIS_PER_DAY = 86_400_000

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  return DAYS_IN_MONTH[month - 1]
}

type DateParts = { year: number; month: number; day: number }

function split(date: string): DateParts {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  }
}

/**
 * `YYYY-MM-DD` 形式で、かつ実在する日付かを判定する。
 *
 * 形式だけでなく実在性も見るのが要点。`2026-02-30` や
 * `2026-02-29`（2026 はうるう年ではない）は形式上は正しく見えるが、
 * 通してしまうと計算結果が静かにずれる。
 */
export function isDateString(value: string): value is DateString {
  if (!PATTERN.test(value)) {
    return false
  }
  const { year, month, day } = split(value)
  if (month < 1 || month > 12) {
    return false
  }
  return day >= 1 && day <= daysInMonth(year, month)
}

/**
 * 検証したうえで DateString に変換する。不正なら例外を投げる。
 *
 * 黙って握りつぶさないのは、不正な日付が混入したまま計算が続くと
 * 「なぜか車検の残り日数がおかしい」という追いにくいバグになるため。
 * DB から来た値もユーザー入力も、この関門を通す。
 */
export function toDateString(value: string): DateString {
  if (!isDateString(value)) {
    throw new Error(`日付として解釈できません: ${value}（YYYY-MM-DD 形式で、実在する日付である必要があります）`)
  }
  return value
}

/**
 * UTC 深夜0時を基準にしたミリ秒値を返す。
 *
 * これは「時刻」ではなく **通日番号として使うための値**。
 * 両辺とも UTC 深夜0時なので、差を取れば夏時間もタイムゾーンも介在せず
 * 正確な日数になる。
 */
export function toUtcMillis(date: DateString): number {
  const { year, month, day } = split(date)
  const millis = Date.UTC(year, month - 1, day)

  // Date.UTC は 0〜99 の年を 1900 年代に写す仕様（Date.UTC(26,...) → 1926年）。
  // 正規表現が 4 桁を許すため 0026-01-01 のような値が届きうるので補正する。
  if (year < 100) {
    const corrected = new Date(millis)
    corrected.setUTCFullYear(year)
    return corrected.getTime()
  }
  return millis
}

/**
 * from から to までの日数。to が過去なら負の数を返す。
 *
 * 車検の残り日数はこれで求める。0 なら当日、負なら期限切れ。
 */
export function daysBetween(from: DateString, to: DateString): number {
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / MILLIS_PER_DAY)
}

/** date が other と同日か、それより後なら true。 */
export function isOnOrAfter(date: DateString, other: DateString): boolean {
  return date >= other
}

/** date が other と同日か、それより前なら true。 */
export function isOnOrBefore(date: DateString, other: DateString): boolean {
  return date <= other
}
