import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseEnv } from './env'

describe('getSupabaseEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY が揃っていれば値を返す', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_xxxxx')

    expect(getSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_xxxxx',
    })
  })

  it('VITE_SUPABASE_URL が URL 形式でなければ例外を投げる', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_xxxxx')

    expect(() => getSupabaseEnv()).toThrow('Supabase の環境変数')
  })

  it('VITE_SUPABASE_PUBLISHABLE_KEY が空文字なら例外を投げる', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')

    expect(() => getSupabaseEnv()).toThrow('Supabase の環境変数')
  })
})
