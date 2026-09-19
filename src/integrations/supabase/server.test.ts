import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn((..._args: Array<unknown>) => ({ marker: 'fake-server-client' }))
const getCookiesMock = vi.fn(() => ({ a: '1', b: '2' }))
const setCookieMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@tanstack/react-start/server', () => ({
  getCookies: getCookiesMock,
  setCookie: setCookieMock,
}))

vi.mock('@/lib/supabase/env', () => ({
  getSupabaseEnv: () => ({ url: 'https://example.supabase.co', publishableKey: 'sb_publishable_xxxxx' }),
}))

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    createServerClientMock.mockClear()
    getCookiesMock.mockClear()
    setCookieMock.mockClear()
  })

  it('env の値で createServerClient を呼び出す', async () => {
    const { createSupabaseServerClient } = await import('./server')

    createSupabaseServerClient()

    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_xxxxx',
      expect.objectContaining({ cookies: expect.any(Object) }),
    )
  })

  it('cookieOptions.secure を true にして呼び出す（多層防御）', async () => {
    const { createSupabaseServerClient } = await import('./server')

    createSupabaseServerClient()

    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_xxxxx',
      expect.objectContaining({ cookieOptions: expect.objectContaining({ secure: true }) }),
    )
  })

  it('呼び出すたびに新しいクライアントを作る（モジュールスコープでメモ化しない）', async () => {
    const { createSupabaseServerClient } = await import('./server')

    createSupabaseServerClient()
    createSupabaseServerClient()
    createSupabaseServerClient()

    expect(createServerClientMock).toHaveBeenCalledTimes(3)
  })

  it('cookies.getAll は getCookies() の Record を name/value の配列に変換する', async () => {
    const { createSupabaseServerClient } = await import('./server')

    createSupabaseServerClient()
    const options = createServerClientMock.mock.calls[0][2] as { cookies: { getAll: () => unknown } }

    expect(options.cookies.getAll()).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ])
  })

  it('cookies.setAll は渡された各クッキーで setCookie() を呼ぶ', async () => {
    const { createSupabaseServerClient } = await import('./server')

    createSupabaseServerClient()
    const options = createServerClientMock.mock.calls[0][2] as {
      cookies: { setAll: (cookies: Array<{ name: string; value: string; options: unknown }>) => void }
    }

    options.cookies.setAll([
      { name: 'sb-access-token', value: 'token-value', options: { path: '/' } },
      { name: 'sb-refresh-token', value: 'refresh-value', options: { path: '/', httpOnly: true } },
    ])

    expect(setCookieMock).toHaveBeenCalledTimes(2)
    expect(setCookieMock).toHaveBeenNthCalledWith(1, 'sb-access-token', 'token-value', { path: '/' })
    expect(setCookieMock).toHaveBeenNthCalledWith(2, 'sb-refresh-token', 'refresh-value', {
      path: '/',
      httpOnly: true,
    })
  })
})
