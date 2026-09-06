import type { DateString } from '@/lib/date/date-string'

/**
 * 車検UI（アラート表示・満了日欄など）を出すべきかどうかを判定する。
 *
 * 250cc 以下のバイクなど車検制度の対象外の車両は、登録時に満了日を
 * 設定しない（`shakenExpiryDate` が `null`）。車両区分では分岐させず、
 * 満了日の有無だけで判定する — ユーザーがどの車両に満了日を設定するかは
 * 任意であり、車両区分から一意に決まるものではないため。
 */
export function shakenRequired(shakenExpiryDate: DateString | null): boolean {
  return shakenExpiryDate !== null
}
