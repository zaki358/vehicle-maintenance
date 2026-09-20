import { describe, expect, it } from 'vitest'

import { parseAuthHash } from './parse-auth-hash'

describe('parseAuthHash', () => {
  it('招待リンクのハッシュからトークンを取り出す', () => {
    const result = parseAuthHash(
      '#access_token=at-123&expires_in=3600&refresh_token=rt-456&token_type=bearer&type=invite',
    )

    expect(result).toEqual({ kind: 'tokens', accessToken: 'at-123', refreshToken: 'rt-456' })
  })

  it('先頭の # が無くても解析できる', () => {
    const result = parseAuthHash('access_token=at-123&refresh_token=rt-456&type=recovery')

    expect(result).toEqual({ kind: 'tokens', accessToken: 'at-123', refreshToken: 'rt-456' })
  })

  it('期限切れリンクのエラーコードを返す', () => {
    const result = parseAuthHash(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    )

    expect(result).toEqual({ kind: 'error', code: 'otp_expired' })
  })

  it('error_code が無いエラーは unknown として返す', () => {
    const result = parseAuthHash('#error=server_error')

    expect(result).toEqual({ kind: 'error', code: 'unknown' })
  })

  it('空のハッシュは none を返す', () => {
    expect(parseAuthHash('')).toEqual({ kind: 'none' })
    expect(parseAuthHash('#')).toEqual({ kind: 'none' })
  })

  it('refresh_token が欠けていれば none を返す', () => {
    expect(parseAuthHash('#access_token=at-123&type=invite')).toEqual({ kind: 'none' })
  })

  it('access_token が空文字なら none を返す', () => {
    expect(parseAuthHash('#access_token=&refresh_token=rt-456')).toEqual({ kind: 'none' })
  })
})
