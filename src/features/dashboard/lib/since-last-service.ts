import type { DateString } from '@/lib/date/date-string'
import { daysBetween } from '@/lib/date/date-string'

export type LastServiceInfo = {
  lastPerformedOn: DateString
  daysSince: number
}

type ServiceRecord = {
  performedOn: DateString
}

export function sinceLastService<T extends ServiceRecord>(
  records: readonly T[],
  today: DateString,
): LastServiceInfo | null {
  if (records.length === 0) {
    return null
  }

  const lastPerformedOn = records.reduce<DateString>(
    (latest, record) => (record.performedOn > latest ? record.performedOn : latest),
    records[0].performedOn,
  )

  return {
    lastPerformedOn,
    daysSince: daysBetween(lastPerformedOn, today),
  }
}
