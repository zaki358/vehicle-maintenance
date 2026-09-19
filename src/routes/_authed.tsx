import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUser } from '@/features/auth/require-user'
import { getSessionFn } from '@/features/auth/server/get-session'

/**
 * ログイン必須のページをまとめるレイアウトルート。
 *
 * ファイル名の先頭 `_` は「URL に現れないレイアウト専用ルート」という
 * TanStack Router の規約。`routes/_authed.vehicles.tsx` のような子ルートは
 * URL 上は `/vehicles` のままで、このファイルの `beforeLoad` だけを必ず通る。
 *
 * ガードそのものは `requireUser`（純粋関数）に委譲している。ここでは
 * 「セッションを取得する」という副作用と、「取得結果に応じて処理を分岐する」
 * ロジックを1行でつなぐだけ。
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getSessionFn()
    return { user: requireUser(user, location.href) }
  },
  component: () => <Outlet />,
})
