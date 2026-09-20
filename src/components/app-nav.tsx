import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { logoutFn } from '@/features/auth/server/logout'

/**
 * ログイン後の全ページに出る上部の黒いナビ。
 *
 * ログアウトをここに置いているのは、どの画面からでも同じ場所で操作できるようにするため
 * （以前はダッシュボードにだけ置いていた）。リンクが3つしかないので、
 * 狭い画面でもハンバーガーに畳まず文字間を詰めるだけで収める。
 */
export function AppNav() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setLoggingOut(true)
    setError(null)
    try {
      await logoutFn()
      await navigate({ to: '/login', replace: true })
    } catch {
      setError('ログアウトに失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">
          車両メンテナンス記録
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            ダッシュボード
          </Link>
          <Link to="/vehicles" className="nav-link">
            車両
          </Link>
          <button type="button" className="btn btn-utility" onClick={handleLogout} disabled={loggingOut}>
            ログアウト
          </button>
        </div>
      </nav>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
    </>
  )
}
