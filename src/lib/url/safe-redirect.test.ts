import { describe, expect, it } from 'vitest'

import { isSafeRedirectPath } from './safe-redirect'

describe('isSafeRedirectPath', () => {
  it('アプリ内の相対パスは許可する', () => {
    expect(isSafeRedirectPath('/vehicles')).toBe(true)
    expect(isSafeRedirectPath('/vehicles/123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isSafeRedirectPath('/')).toBe(true)
  })

  it('絶対URL(他ドメインへのオープンリダイレクト)は拒否する', () => {
    expect(isSafeRedirectPath('https://evil.example.com/')).toBe(false)
    expect(isSafeRedirectPath('http://evil.example.com')).toBe(false)
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false)
  })

  it('プロトコル相対URL(//)は拒否する', () => {
    expect(isSafeRedirectPath('//evil.example.com')).toBe(false)
  })

  it('バックスラッシュ経由でプロトコル相対に化けうる値は拒否する', () => {
    expect(isSafeRedirectPath('/\\evil.example.com')).toBe(false)
  })

  it('スラッシュで始まらない値は拒否する', () => {
    expect(isSafeRedirectPath('vehicles')).toBe(false)
    expect(isSafeRedirectPath('')).toBe(false)
  })
})
