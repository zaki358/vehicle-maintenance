import { describe, expect, it, vi } from 'vitest'

import { updateVehicleHandler } from './update'

describe('updateVehicleHandler', () => {
  it('入力をDB列名にマッピングして更新し、更新後の行を返す', async () => {
    const row = { id: 'v1', name: '愛車2' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    const result = await updateVehicleHandler(
      { id: 'v1', name: '愛車2', vehicleType: 'motorcycle', shakenExpiryDate: null, note: 'メモ' },
      { supabase: { from } },
    )

    expect(result).toBe(row)
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(update).toHaveBeenCalledWith({
      name: '愛車2',
      vehicle_type: 'motorcycle',
      shaken_expiry_date: null,
      note: 'メモ',
    })
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })

  it('存在しない・他人の車両なら null を返す', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    const result = await updateVehicleHandler(
      { id: 'missing', name: '愛車2', vehicleType: 'car', shakenExpiryDate: null, note: '' },
      { supabase: { from } },
    )

    expect(result).toBeNull()
  })

  it('エラー時は例外を投げる', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    await expect(
      updateVehicleHandler(
        { id: 'v1', name: '愛車2', vehicleType: 'car', shakenExpiryDate: null, note: '' },
        { supabase: { from } },
      ),
    ).rejects.toThrow('boom')
  })
})
