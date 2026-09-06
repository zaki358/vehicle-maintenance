import type { DateString } from '@/lib/date/date-string'

/** 新しい順（既定・一覧表示のデフォルト）か古い順か。 */
export type RecordSortOrder = 'newest' | 'oldest'

type SortableRecord = { performedOn: DateString }

/**
 * 整備記録を実施日で並べ替える。元の配列は変更しない。
 *
 * `DateString` はゼロ埋めされた `YYYY-MM-DD` なので、文字列としての大小比較が
 * そのまま日付の前後関係と一致する（date-string.ts 参照）。
 */
export function sortRecords<T extends SortableRecord>(
  records: readonly T[],
  order: RecordSortOrder = 'newest',
): T[] {
  const compareAsc = (a: T, b: T): number => {
    if (a.performedOn < b.performedOn) return -1
    if (a.performedOn > b.performedOn) return 1
    return 0
  }
  return [...records].sort(order === 'oldest' ? compareAsc : (a, b) => compareAsc(b, a))
}
