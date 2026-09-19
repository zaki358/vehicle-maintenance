import { describe, expect, it, vi } from 'vitest'

import { listAllRecordsHandler } from './list-all'

describe('listAllRecordsHandler', () => {
  it('自分の整備記録を車両を問わず全件返す', async () => {
    const rows = [{ id: 'r1' }, { id: 'r2' }]
    const select = vi.fn().mockResolvedValue({ data: rows, error: null })
    const from = vi.fn().mockReturnValue({ select })

    const result = await listAllRecordsHandler({ supabase: { from } })

    expect(result).toBe(rows)
    expect(from).toHaveBeenCalledWith('maintenance_records')
    expect(select).toHaveBeenCalledWith('*')
  })

  it('エラー時は例外を投げる', async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const from = vi.fn().mockReturnValue({ select })

    await expect(listAllRecordsHandler({ supabase: { from } })).rejects.toThrow('boom')
  })
})
