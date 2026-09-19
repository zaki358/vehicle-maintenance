import { redirect } from '@tanstack/react-router'

export interface AuthedUser {
  id: string
  email: string | null
}

/**
 * ログイン済みユーザーを要求する。未ログインなら `/login` へリダイレクトする。
 *
 * ルートの `beforeLoad` から呼ぶことを想定しているが、これ自体はネットワークも
 * ルーターの状態も参照しない純粋な関数。「セッションを取得する」処理
 * （`features/auth/server/get-session.ts`）と「取得結果に応じてどう振る舞うか」
 * を分けることで、この分岐ロジックだけを DB 無しでテストできる。
 *
 * **これはあくまで UX のためのガードであり、セキュリティ境界ではない。**
 * 本当の安全境界は Supabase の RLS（`auth.uid() = user_id`）。ここを通過せずに
 * サーバー関数やルートへ直接リクエストされても、RLS が他人のデータへのアクセスを拒む。
 */
export function requireUser(user: AuthedUser | null, redirectTo: string): AuthedUser {
  if (!user) {
    throw redirect({ to: '/login', search: { redirect: redirectTo } })
  }
  return user
}
