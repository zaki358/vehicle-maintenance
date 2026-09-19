import { describe, expect, it, vi } from 'vitest'

import { getSessionHandler } from './get-session'

describe('getSessionHandler', () => {
  it('getClaims が成功すれば id と email を返す', async () => {
    const supabase = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'user-1', email: 'owner@example.com' } },
          error: null,
        }),
      },
    }

    expect(await getSessionHandler({ supabase })).toEqual({ id: 'user-1', email: 'owner@example.com' })
  })

  it('email クレームが無ければ null を補う', async () => {
    const supabase = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'user-1' } },
          error: null,
        }),
      },
    }

    expect(await getSessionHandler({ supabase })).toEqual({ id: 'user-1', email: null })
  })

  it('error があれば null を返す', async () => {
    const supabase = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: { message: 'invalid jwt' } }),
      },
    }

    expect(await getSessionHandler({ supabase })).toBeNull()
  })

  it('data も error も無ければ（未ログイン） null を返す', async () => {
    const supabase = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    }

    expect(await getSessionHandler({ supabase })).toBeNull()
  })
})
