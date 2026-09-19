import { describe, expect, it, vi } from 'vitest'

import { completeShakenHandler } from './complete-shaken'

describe('completeShakenHandler', () => {
  const input = {
    vehicleId: 'v1',
    shaken: {
      performedOn: '2026-09-06' as never,
      newExpiryDate: '2028-09-06' as never,
      odometerKm: 12345,
      partDetail: '継続検査',
      note: '',
    },
  }

  it('complete_shaken RPCをパラメータ名にマッピングして呼び出し、作成された記録を返す', async () => {
    const row = { id: 'r1', work_type: 'shaken' }
    const rpc = vi.fn().mockResolvedValue({ data: row, error: null })

    const result = await completeShakenHandler(input, { supabase: { rpc } })

    expect(result).toBe(row)
    expect(rpc).toHaveBeenCalledWith('complete_shaken', {
      p_vehicle_id: 'v1',
      p_performed_on: '2026-09-06',
      p_new_expiry_date: '2028-09-06',
      p_odometer_km: 12345,
      p_part_detail: '継続検査',
      p_note: '',
    })
  })

  it('エラー時は例外を投げる', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })

    await expect(completeShakenHandler(input, { supabase: { rpc } })).rejects.toThrow('boom')
  })
})
