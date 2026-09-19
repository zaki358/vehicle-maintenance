import { describe, expect, it, vi } from 'vitest'

import { logoutHandler } from './logout'

describe('logoutHandler', () => {
  it('supabase.auth.signOut() を呼ぶ', async () => {
    const supabase = { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } }

    await logoutHandler({ supabase })

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })
})
