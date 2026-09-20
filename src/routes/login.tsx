import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'

import { loginSchema } from '@/features/auth/lib/login-schema'
import { loginFn } from '@/features/auth/server/login'
import { isSafeRedirectPath } from '@/lib/url/safe-redirect'

const loginSearchSchema = z.object({
  // 絶対URLやプロトコル相対URLが混入した場合はオープンリダイレクトになるため、
  // 安全な相対パスでなければ既定の遷移先（'/'）にフォールバックさせる。
  redirect: z
    .string()
    .transform((value) => (isSafeRedirectPath(value) ? value : undefined))
    .optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '入力内容を確認してください')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const result = await loginFn({ data: parsed.data })
      if (!result.success) {
        setError(result.error)
        return
      }
      await navigate({ href: redirect ?? '/', replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <section className="section section-compact">
        <div className="card card-centered">
          <div className="stack-tight">
            <h1>ログイン</h1>
            <p className="field-hint">車両メンテナンス記録</p>
          </div>
          <form onSubmit={handleSubmit} className="form-stack">
            <label className="field">
              <span className="field-label">メールアドレス</span>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">パスワード</span>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p role="alert" className="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              ログイン
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
