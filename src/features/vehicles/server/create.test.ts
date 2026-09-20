import { describe, expect, it, vi } from 'vitest'

import { createVehicleHandler } from './create'

describe('createVehicleHandler', () => {
  it('入力をDB列名にマッピングして挿入し、作成された行を返す', async () => {
    const row = { id: 'v1', name: '愛車' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })

    const result = await createVehicleHandler(
      { name: '愛車', modelCode: 'ZC33S', vehicleType: 'car', shakenExpiryDate: '2027-01-01' as never, note: '' },
      { supabase: { from } },
    )

    expect(result).toBe(row)
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(insert).toHaveBeenCalledWith({
      name: '愛車',
      model_code: 'ZC33S',
      vehicle_type: 'car',
      shaken_expiry_date: '2027-01-01',
      note: '',
    })
  })

  it('エラー時は例外を投げる', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })

    await expect(
      createVehicleHandler(
        { name: '愛車', modelCode: '', vehicleType: 'car', shakenExpiryDate: null, note: '' },
        { supabase: { from } },
      ),
    ).rejects.toThrow('boom')
  })
})
