import { describe, expect, it, vi } from 'vitest'

import { listVehiclesHandler } from './list'

describe('listVehiclesHandler', () => {
  it('自分の車両一覧を作成日昇順で返す', async () => {
    const rows = [{ id: 'v1' }, { id: 'v2' }]
    const order = vi.fn().mockResolvedValue({ data: rows, error: null })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })

    const result = await listVehiclesHandler({ supabase: { from } })

    expect(result).toBe(rows)
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('エラー時は例外を投げる', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })

    await expect(listVehiclesHandler({ supabase: { from } })).rejects.toThrow('boom')
  })
})
