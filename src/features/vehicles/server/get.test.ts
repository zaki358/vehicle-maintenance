import { describe, expect, it, vi } from 'vitest'

import { getVehicleHandler } from './get'

describe('getVehicleHandler', () => {
  it('自分の車両であれば返す', async () => {
    const row = { id: 'v1' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    const result = await getVehicleHandler({ id: 'v1' }, { supabase: { from } })

    expect(result).toBe(row)
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })

  it('存在しない・他人の車両なら null を返す', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    const result = await getVehicleHandler({ id: 'missing' }, { supabase: { from } })

    expect(result).toBeNull()
  })

  it('エラー時は例外を投げる', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })

    await expect(getVehicleHandler({ id: 'v1' }, { supabase: { from } })).rejects.toThrow('boom')
  })
})
