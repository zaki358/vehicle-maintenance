import { describe, expect, it, vi } from 'vitest'

import { listPartDetailsHandler } from './list-part-details'

describe('listPartDetailsHandler', () => {
  it('指定した車両のpart_detail列だけを実施日の新しい順で返す', async () => {
    const rows = [{ part_detail: 'オイルA' }, { part_detail: '' }]
    const order = vi.fn().mockResolvedValue({ data: rows, error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    const result = await listPartDetailsHandler({ vehicleId: 'v1' }, { supabase: { from } })

    expect(result).toBe(rows)
    expect(from).toHaveBeenCalledWith('maintenance_records')
    expect(select).toHaveBeenCalledWith('part_detail')
    expect(eq).toHaveBeenCalledWith('vehicle_id', 'v1')
    expect(order).toHaveBeenCalledWith('performed_on', { ascending: false })
  })

  it('エラー時は例外を投げる', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    await expect(listPartDetailsHandler({ vehicleId: 'v1' }, { supabase: { from } })).rejects.toThrow('boom')
  })
})
