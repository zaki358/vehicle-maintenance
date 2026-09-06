import type { DateString } from '@/lib/date/date-string'
import { isOnOrAfter, isOnOrBefore } from '@/lib/date/date-string'

export type OdometerReading = {
  performedOn: DateString
  odometerKm: number
}

/**
 * 走行距離は時間とともに増え続けるはずという前提のもとで、新しい入力
 * （`candidate`）が既存の記録（`otherRecords`、自分自身は含めない）と矛盾しないかを判定する。
 *
 * 矛盾には2方向ある:
 * 1. `candidate` と同日以前の記録の方が走行距離が多い → 時間が巻き戻っている
 * 2. `candidate` と同日以降の記録の方が走行距離が少ない → 未来のほうが減っている
 *
 * 同日の記録同士は「以前」「以降」の両方の判定対象になる
 * （`isOnOrAfter`/`isOnOrBefore` はどちらも同日を含むため）。これは同日に
 * 複数回記録した場合でも走行距離の前後関係チェックが効くようにするための挙動。
 */
export function isOdometerRegression(candidate: OdometerReading, otherRecords: readonly OdometerReading[]): boolean {
  return otherRecords.some((other) => {
    const otherIsEarlierOrSameDay = isOnOrBefore(other.performedOn, candidate.performedOn)
    if (otherIsEarlierOrSameDay && other.odometerKm > candidate.odometerKm) {
      return true
    }

    const otherIsLaterOrSameDay = isOnOrAfter(other.performedOn, candidate.performedOn)
    if (otherIsLaterOrSameDay && other.odometerKm < candidate.odometerKm) {
      return true
    }

    return false
  })
}
