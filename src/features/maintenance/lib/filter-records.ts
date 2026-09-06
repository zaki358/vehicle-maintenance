import type { DateString } from '@/lib/date/date-string'
import { isOnOrAfter, isOnOrBefore } from '@/lib/date/date-string'

/**
 * 未指定のキーは「絞り込まない」を意味する。すべて省略すれば全件が対象。
 * 車両・作業内容・実施日の各観点は独立しており、指定したものだけを AND で組み合わせる。
 */
export type RecordFilter = {
  vehicleId?: string
  workType?: string
  from?: DateString
  to?: DateString
}

type FilterableRecord = {
  vehicleId: string
  workType: string
  performedOn: DateString
}

/** 整備記録の一覧を条件で絞り込む。元の配列は変更しない。 */
export function filterRecords<T extends FilterableRecord>(records: readonly T[], filter: RecordFilter): T[] {
  return records.filter((record) => {
    if (filter.vehicleId !== undefined && record.vehicleId !== filter.vehicleId) {
      return false
    }
    if (filter.workType !== undefined && record.workType !== filter.workType) {
      return false
    }
    if (filter.from !== undefined && !isOnOrAfter(record.performedOn, filter.from)) {
      return false
    }
    if (filter.to !== undefined && !isOnOrBefore(record.performedOn, filter.to)) {
      return false
    }
    return true
  })
}
