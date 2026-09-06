import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { filterRecords } from './filter-records'

type TestRecord = { id: string; vehicleId: string; workType: string; performedOn: ReturnType<typeof toDateString> }

const records: TestRecord[] = [
  { id: '1', vehicleId: 'v1', workType: 'engine_oil', performedOn: toDateString('2026-01-10') },
  { id: '2', vehicleId: 'v1', workType: 'tire', performedOn: toDateString('2026-05-01') },
  { id: '3', vehicleId: 'v2', workType: 'engine_oil', performedOn: toDateString('2026-06-15') },
  { id: '4', vehicleId: 'v1', workType: 'engine_oil', performedOn: toDateString('2026-09-01') },
]

describe('filterRecords', () => {
  it('条件を何も指定しなければ全件返す', () => {
    expect(filterRecords(records, {})).toEqual(records)
  })

  it('vehicleId で絞り込む', () => {
    const result = filterRecords(records, { vehicleId: 'v1' })
    expect(result.map((r) => r.id)).toEqual(['1', '2', '4'])
  })

  it('workType で絞り込む', () => {
    const result = filterRecords(records, { workType: 'engine_oil' })
    expect(result.map((r) => r.id)).toEqual(['1', '3', '4'])
  })

  it('vehicleId と workType を組み合わせて絞り込む', () => {
    const result = filterRecords(records, { vehicleId: 'v1', workType: 'engine_oil' })
    expect(result.map((r) => r.id)).toEqual(['1', '4'])
  })

  it('from で絞り込む(その日を含む)', () => {
    const result = filterRecords(records, { from: toDateString('2026-05-01') })
    expect(result.map((r) => r.id)).toEqual(['2', '3', '4'])
  })

  it('to で絞り込む(その日を含む)', () => {
    const result = filterRecords(records, { to: toDateString('2026-05-01') })
    expect(result.map((r) => r.id)).toEqual(['1', '2'])
  })

  it('from と to で範囲指定する', () => {
    const result = filterRecords(records, { from: toDateString('2026-02-01'), to: toDateString('2026-08-01') })
    expect(result.map((r) => r.id)).toEqual(['2', '3'])
  })

  it('該当が無ければ空配列を返す', () => {
    expect(filterRecords(records, { vehicleId: 'v3' })).toEqual([])
  })

  it('元の配列を変更しない', () => {
    const before = [...records]
    filterRecords(records, { vehicleId: 'v1' })
    expect(records).toEqual(before)
  })
})
