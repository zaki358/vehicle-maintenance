import { describe, expect, it, vi } from 'vitest'

import { deleteVehicleHandler } from './delete'

describe('deleteVehicleHandler', () => {
  it('指定したidの車両を削除する', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })

    await deleteVehicleHandler({ id: 'v1' }, { supabase: { from } })

    expect(from).toHaveBeenCalledWith('vehicles')
    expect(eq).toHaveBeenCalledWith('id', 'v1')
  })

  it('エラー時は例外を投げる', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })

    await expect(deleteVehicleHandler({ id: 'v1' }, { supabase: { from } })).rejects.toThrow('boom')
  })
})
