import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { logoutFn } from '@/features/auth/server/logout'

/**
 * ログイン後の仮の着地ページ。
 *
 * 本来のダッシュボード（車両一覧・車検アラート）は Phase 7 で実装する。
 * このファイルは Phase 4（認証）の時点で `_authed` ガードとログイン導線を
 * ブラウザで実際に確認できるようにするための最小限の仮実装であり、
 * Phase 7 で中身を丸ごと置き換える。
 */
export const Route = createFileRoute('/_authed/')({
  component: AuthedHome,
})

function AuthedHome() {
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logoutFn()
      await navigate({ to: '/login', replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <main>
      <h1>車両メンテナンス記録</h1>
      <p>ログイン中: {user.email ?? user.id}</p>
      <p>
        <Link to="/vehicles">車両一覧へ</Link>
      </p>
      <button type="button" onClick={handleLogout} disabled={loggingOut}>
        ログアウト
      </button>
    </main>
  )
}
