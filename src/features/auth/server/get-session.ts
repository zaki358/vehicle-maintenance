import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { AuthedUser } from '../require-user'

interface GetSessionDeps {
  supabase: { auth: Pick<SupabaseClient<Database>['auth'], 'getClaims'> }
}

/**
 * 現在のリクエストのログイン状態を返す。ログインしていなければ `null`。
 *
 * `getSession()` ではなく `getClaims()` を使うのが要点。`getSession()` は
 * サーバー側で JWT の署名を検証しない（Cookie の値をそのまま信頼してしまう）のに対し、
 * `getClaims()` は WebCrypto でローカルに署名検証するため、ネットワーク往復無しで
 * 安全にユーザーを確定できる。
 *
 * `deps` にデフォルト値を持たせず必須にしているのは、`createSupabaseServerClient`
 * （`@tanstack/react-start/server` に依存する）への参照をこの関数の外に出すため。
 * デフォルト値としてここに書いてしまうと、`getSessionHandler` をテストのために
 * import しただけのクライアントバンドルにもサーバー専用コードが引きずられて混入し、
 * TanStack Start のビルドが「サーバー専用 import をクライアント環境に混入させるな」
 * という import-protection エラーで失敗する。
 */
export async function getSessionHandler(deps: GetSessionDeps): Promise<AuthedUser | null> {
  const { data, error } = await deps.supabase.auth.getClaims()
  if (error || !data) {
    return null
  }
  return { id: data.claims.sub, email: data.claims.email ?? null }
}

export const getSessionFn = createServerFn({ method: 'GET' }).handler(() =>
  getSessionHandler({ supabase: createSupabaseServerClient() }),
)
