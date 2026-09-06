import { describe, expect, it } from 'vitest'

import { loginSchema } from './login-schema'

describe('loginSchema', () => {
  it('正しいメールアドレスとパスワードを受け入れる', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'correct-horse' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ email: 'user@example.com', password: 'correct-horse' })
  })

  it('メールアドレス前後の空白を取り除く', () => {
    const result = loginSchema.safeParse({ email: '  user@example.com  ', password: 'pw' })

    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('user@example.com')
  })

  it('パスワード前後の空白は取り除かない', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '  pw  ' })

    expect(result.success).toBe(true)
    expect(result.data?.password).toBe('  pw  ')
  })

  it('メールアドレスが空なら必須エラーになる', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pw' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('メールアドレスを入力してください')
  })

  it('メールアドレスの形式が不正ならエラーになる', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pw' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.message === 'メールアドレスの形式が正しくありません')).toBe(
      true,
    )
  })

  it('パスワードが空なら必須エラーになる', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('パスワードを入力してください')
  })
})
