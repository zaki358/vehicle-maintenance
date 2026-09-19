import type { DateString } from './date-string'

/**
 * 日本語表示の整形専用ファイル。
 *
 * ## Date を使うが、フィールドは必ず UTC 側から読む
 *
 * `date-string.ts` や `add-months.ts` は、Cloudflare Workers(UTC) と
 * 利用者の端末(JST) のタイムゾーン差を避けるため、意図的に `Date` を
 * 一切使わず文字列と整数だけでカレンダー計算をしている。
 *
 * このファイルは「計算」ではなく **表示用の文字列への変換**なので、
 * `YYYY-MM-DD` を `Date` に変換すること自体は問題にならない。
 * ただし `getFullYear()`/`getMonth()`/`getDay()` のようなローカル
 * タイムゾーン版のゲッターは、実行環境のタイムゾーンによって前後1日
 * ずれうる（西経のタイムゾーンで実行すると前日になる等）。そのため
 * 必ず `getUTCFullYear()`/`getUTCMonth()`/`getUTCDay()` のような
 * UTC 版のゲッターだけを使い、実行環境のタイムゾーンに一切左右され
 * ないようにする。
 *
 * **計算にこのファイルを使ってはいけない。** 日付の前後比較や加減算は
 * 必ず `date-string.ts` / `add-months.ts` 側の関数を使うこと。
 */

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'] as const

function toUtcParts(date: DateString) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
    weekday: WEEKDAY_JA[parsed.getUTCDay()],
  }
}

/**
 * 「2026年9月6日(日)」のような、曜日付きの日本語表示。
 * 満了日やメンテナンス記録の日付など、しっかり読ませたい場面で使う。
 */
export function formatJa(date: DateString): string {
  const { year, month, day, weekday } = toUtcParts(date)
  return `${year}年${month}月${day}日(${weekday})`
}

/**
 * 「9/6」のような短い表示。
 * 記録一覧など、日付列を何行も並べる場面で使う。
 */
export function formatJaShort(date: DateString): string {
  const { month, day } = toUtcParts(date)
  return `${month}/${day}`
}
