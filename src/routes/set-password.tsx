import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { authErrorMessage } from '@/features/auth/lib/auth-errors'
import { getSupabaseBrowserClient } from '@/integrations/supabase/client'

export const Route = createFileRoute('/set-password')({
  component: SetPasswordPage,
})

/**
 * 招待メールのリンクを踏んだ利用者が、初回パスワードを設定するページ。
 *
 * このページはサーバー関数を経由しない。`supabase.auth.admin.inviteUserByEmail()`
 * は PKCE 非対応（招待する側とリンクを踏む側でブラウザが異なるため、
 * Supabase 公式ドキュメントが明記している制約）なので、招待リンクの URL には
 * `?code=...` ではなく `#access_token=...&refresh_token=...&type=invite` という
 * ハッシュフラグメントが付く。`@supabase/ssr` の `createBrowserClient` は
 * `detectSessionInUrl: true` がデフォルトで、これをマウント時に自動検出して
 * セッションを確立する。
 *
 * これが機能するのは、セッション用 Cookie をあえて httpOnly に
 * **しない**設計だから（`integrations/supabase/server.ts` 参照）。
 * ブラウザ側のクライアントが Cookie を読み書きできる前提のもとで、
 * `supabase.auth.updateUser()` をブラウザから直接呼ぶだけで、新しい
 * パスワードを保存できる。
 */
function SetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }
    if (password !== confirmPassword) {
      setError('確認用パスワードが一致しません')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(authErrorMessage({ code: updateError.code, message: updateError.message }))
        return
      }
      await navigate({ to: '/', replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <h1>パスワードの設定</h1>
      <form onSubmit={handleSubmit}>
        <label>
          新しいパスワード
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          新しいパスワード（確認）
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          設定する
        </button>
      </form>
    </main>
  )
}
