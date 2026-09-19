import { describe, expect, it, vi } from 'vitest'

import { deleteRecordHandler } from './delete'

describe('deleteRecordHandler', () => {
  it('指定したidの整備記録を削除する', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })

    await deleteRecordHandler({ id: 'r1' }, { supabase: { from } })

    expect(from).toHaveBeenCalledWith('maintenance_records')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('エラー時は例外を投げる', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    const del = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ delete: del })

    await expect(deleteRecordHandler({ id: 'r1' }, { supabase: { from } })).rejects.toThrow('boom')
  })
})
