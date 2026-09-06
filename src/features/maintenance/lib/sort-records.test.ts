import { describe, expect, it } from 'vitest'

import { toDateString } from '@/lib/date/date-string'
import { sortRecords } from './sort-records'

type TestRecord = { id: string; performedOn: ReturnType<typeof toDateString> }

const records: TestRecord[] = [
  { id: 'b', performedOn: toDateString('2026-05-01') },
  { id: 'a', performedOn: toDateString('2026-01-10') },
  { id: 'c', performedOn: toDateString('2026-09-01') },
]

describe('sortRecords', () => {
  it('既定（省略時）は新しい順', () => {
    const result = sortRecords(records)
    expect(result.map((r) => r.id)).toEqual(['c', 'b', 'a'])
  })

  it('newest を指定すると新しい順', () => {
    const result = sortRecords(records, 'newest')
    expect(result.map((r) => r.id)).toEqual(['c', 'b', 'a'])
  })

  it('oldest を指定すると古い順', () => {
    const result = sortRecords(records, 'oldest')
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('元の配列を変更しない', () => {
    const before = [...records]
    sortRecords(records, 'oldest')
    expect(records).toEqual(before)
  })

  it('空配列を渡すと空配列を返す', () => {
    expect(sortRecords([])).toEqual([])
  })

  it('実施日が同じ記録同士は順序を保つ', () => {
    const sameDay: TestRecord[] = [
      { id: 'x', performedOn: toDateString('2026-05-01') },
      { id: 'y', performedOn: toDateString('2026-05-01') },
    ]
    expect(sortRecords(sameDay, 'newest').map((r) => r.id)).toEqual(['x', 'y'])
    expect(sortRecords(sameDay, 'oldest').map((r) => r.id)).toEqual(['x', 'y'])
  })
})
