import type { DateString } from './date-string'

/**
 * 月・年単位でのカレンダー加算。
 *
 * 車検の更新は「+2年」「+3年」という月単位の加算そのものなので、
 * ここが車検ドメインの計算の土台になる（features/shaken/lib/renewal.ts から使われる）。
 *
 * ## 月末クランプについて
 *
 * 「1月31日の1ヶ月後」のように、加算先の月にその日が存在しないケースがある
 * （2月に31日は無い）。この場合は自動的にその月の末日にクランプする
 * （1/31 → 2/28、うるう年なら 2/29）。
 *
 * JavaScript の `Date` はこれを自前ではやってくれない
 * （`setMonth` は月を繰り越してしまい、1/31 の1ヶ月後が 3/3 になったりする）ため、
 * 「まず月を計算し、その月の日数を求め、日をその範囲に収める」という
 * 手順を明示的に実装している。
 */

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  return DAYS_IN_MONTH[month - 1]
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function format(year: number, month: number, day: number): DateString {
  return `${year}-${pad2(month)}-${pad2(day)}` as DateString
}

/**
 * date から monthsToAdd ヶ月後（負なら前）の日付を返す。
 * 加算先の月にその日が存在しなければ、その月の末日にクランプする。
 */
export function addMonths(date: DateString, monthsToAdd: number): DateString {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))

  // 月を 0 始まりの通し番号に変換して加算し、年と月に戻す。
  // こうすると年をまたぐ繰り上がり・繰り下がりを剰余演算だけで扱える。
  const totalMonths = year * 12 + (month - 1) + monthsToAdd
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1

  const clampedDay = Math.min(day, daysInMonth(newYear, newMonth))

  return format(newYear, newMonth, clampedDay)
}

/**
 * date から yearsToAdd 年後（負なら前）の日付を返す。
 * 2/29 に yearsToAdd 年後がうるう年でなければ 2/28 にクランプする。
 *
 * `addMonths(date, yearsToAdd * 12)` と等価だが、車検更新のコードで
 * 「年」という単位がそのまま読み取れるように専用の関数として公開する。
 */
export function addYears(date: DateString, yearsToAdd: number): DateString {
  return addMonths(date, yearsToAdd * 12)
}
