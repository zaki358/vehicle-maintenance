import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

import type { DateString } from './date-string'

/**
 * 日本語表示の整形専用ファイル。
 *
 * ## このファイルだけ date-fns を使ってよい理由
 *
 * `date-string.ts` や `add-months.ts` は、Cloudflare Workers(UTC) と
 * 利用者の端末(JST) のタイムゾーン差を避けるため、意図的に `Date` を
 * 一切使わず文字列と整数だけでカレンダー計算をしている。
 *
 * このファイルは違う。ここでやっているのは「計算」ではなく
 * **表示用の文字列への変換**であり、`2026-09-06` が何曜日かを
 * 求めるには標準ライブラリの厚みが要る（自前実装は割に合わない）。
 * `parseISO` で Date に変換することそのものは問題にならない。
 * `YYYY-MM-DD` のような日付のみの文字列は UTC 深夜0時として解釈され、
 * その Date から `year`/`month`/`day` を UTC のフィールドとして
 * 読み戻す限り、実行環境のタイムゾーンに影響されないため。
 *
 * **計算にこのファイルを使ってはいけない。** 日付の前後比較や加減算は
 * 必ず `date-string.ts` / `add-months.ts` 側の関数を使うこと。
 */

/**
 * 「2026年9月6日(日)」のような、曜日付きの日本語表示。
 * 満了日やメンテナンス記録の日付など、しっかり読ませたい場面で使う。
 */
export function formatJa(date: DateString): string {
  return format(parseISO(date), 'yyyy年M月d日(E)', { locale: ja })
}

/**
 * 「9/6」のような短い表示。
 * 記録一覧など、日付列を何行も並べる場面で使う。
 */
export function formatJaShort(date: DateString): string {
  return format(parseISO(date), 'M/d')
}
