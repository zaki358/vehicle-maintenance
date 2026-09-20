import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { authErrorMessage } from '@/features/auth/lib/auth-errors'
import { parseAuthHash } from '@/features/auth/lib/parse-auth-hash'
import { getSupabaseBrowserClient } from '@/integrations/supabase/client'

export const Route = createFileRoute('/set-password')({
  component: SetPasswordPage,
})

const MISSING_LINK_MESSAGE = 'メールに記載されたリンクからこのページを開いてください'

type SessionStatus = 'checking' | 'ready' | 'unavailable'

/**
 * 招待メール・パスワード再設定メールのリンクを踏んだ利用者が、パスワードを設定するページ。
 *
 * このページはサーバー関数を経由しない。招待・再設定リンクは implicit フロー形式
 * (`#access_token=...&refresh_token=...`) で戻ってくるが、`@supabase/ssr` の
 * `createBrowserClient` は flowType を pkce に固定しているため、`detectSessionInUrl`
 * はこのハッシュを「PKCE の URL ではない」として拒否する。そこでマウント時に
 * ハッシュを自前で解析し、`setSession()` で明示的にセッションを確立する。
 *
 * ハッシュはサーバーに送られないため、このページは `_authed` 配下に置けない
 * （サーバー側のガードが未ログインと判定して `/login` に飛ばしてしまう）。
 *
 * セッション用 Cookie をあえて httpOnly に**しない**設計
 * （`integrations/supabase/server.ts` 参照）なので、ブラウザ側で確立した
 * セッションはそのままサーバー関数からも読める。
 */
function SetPasswordPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<SessionStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 開発時の StrictMode は effect を2回実行する。1回目がハッシュを消すため、
  // 2回目は「リンク経由ではない」と誤判定してしまう。実行自体を1回に絞る。
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    establishSession().then((result) => {
      setStatus(result.ok ? 'ready' : 'unavailable')
      setError(result.ok ? null : result.message)
    })
  }, [])

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
      {status === 'checking' && <p>リンクを確認しています…</p>}
      {status === 'ready' && (
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
          <button type="submit" disabled={submitting}>
            設定する
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}

type EstablishResult = { ok: true } | { ok: false; message: string }

async function establishSession(): Promise<EstablishResult> {
  const supabase = getSupabaseBrowserClient()
  const parsed = parseAuthHash(window.location.hash)

  if (parsed.kind !== 'none') {
    // トークンを URL に残さない（履歴・画面共有・Referer からの漏洩を防ぐ）
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  if (parsed.kind === 'error') {
    return { ok: false, message: authErrorMessage({ code: parsed.code, message: '' }) }
  }

  if (parsed.kind === 'tokens') {
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    })
    if (error) {
      return { ok: false, message: authErrorMessage({ code: error.code, message: error.message }) }
    }
    // 期限切れトークンのリフレッシュが失敗したとき、error なしで session だけ null になりうる
    return data.session
      ? { ok: true }
      : { ok: false, message: authErrorMessage({ code: 'otp_expired', message: '' }) }
  }

  const { data } = await supabase.auth.getSession()
  return data.session ? { ok: true } : { ok: false, message: MISSING_LINK_MESSAGE }
}
