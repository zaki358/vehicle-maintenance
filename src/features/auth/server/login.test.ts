import { describe, expect, it, vi } from 'vitest'

import { loginHandler } from './login'

describe('loginHandler', () => {
  it('成功すれば success: true を返す', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      },
    }

    const result = await loginHandler({ email: 'owner@example.com', password: 'correct-password' }, { supabase })

    expect(result).toEqual({ success: true })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'correct-password',
    })
  })

  it('失敗すれば日本語のエラーメッセージ付きで success: false を返す', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: null, error: { code: 'invalid_credentials', message: 'Invalid credentials' } }),
      },
    }

    const result = await loginHandler({ email: 'owner@example.com', password: 'wrong-password' }, { supabase })

    expect(result).toEqual({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' })
  })
})
