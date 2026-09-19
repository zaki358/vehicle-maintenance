import { beforeEach, describe, expect, it, vi } from 'vitest'

const createBrowserClientMock = vi.fn(() => ({ marker: 'fake-browser-client' }))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}))

vi.mock('@/lib/supabase/env', () => ({
  getSupabaseEnv: () => ({ url: 'https://example.supabase.co', publishableKey: 'sb_publishable_xxxxx' }),
}))

describe('getSupabaseBrowserClient', () => {
  beforeEach(() => {
    createBrowserClientMock.mockClear()
    vi.resetModules()
  })

  it('env の値で createBrowserClient を呼び出す', async () => {
    const { getSupabaseBrowserClient } = await import('./client')

    getSupabaseBrowserClient()

    expect(createBrowserClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_xxxxx')
  })

  it('2回呼び出しても createBrowserClient は1回しか実行されない（シングルトン）', async () => {
    const { getSupabaseBrowserClient } = await import('./client')

    const first = getSupabaseBrowserClient()
    const second = getSupabaseBrowserClient()

    expect(first).toBe(second)
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1)
  })
})
