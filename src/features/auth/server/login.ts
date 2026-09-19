import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { authErrorMessage } from '../lib/auth-errors'
import { loginSchema } from '../lib/login-schema'
import type { LoginInput } from '../lib/login-schema'

interface LoginDeps {
  supabase: { auth: Pick<SupabaseClient<Database>['auth'], 'signInWithPassword'> }
}

export type LoginResult = { success: true } | { success: false; error: string }

/**
 * メール＋パスワードでログインする。
 *
 * 成功・失敗にかかわらず Cookie の書き込みはこの関数の責務ではない。
 * `createSupabaseServerClient()` が組み立てるクライアントの `cookies.setAll` が
 * `signInWithPassword` の呼び出し中に Supabase 側から自動的に呼ばれるため、
 * ここでは Cookie を一切意識する必要が無い。
 *
 * `deps` を必須にしている理由は `get-session.ts` と同じ:
 * `createSupabaseServerClient` への参照をデフォルト値としてここに書くと、
 * テストのために `loginHandler` を import しただけのクライアントバンドルにも
 * サーバー専用コードが引きずられ、TanStack Start の import-protection に
 * 引っかかってビルドが失敗する。
 */
export async function loginHandler(input: LoginInput, deps: LoginDeps): Promise<LoginResult> {
  const { error } = await deps.supabase.auth.signInWithPassword(input)
  if (error) {
    return { success: false, error: authErrorMessage({ code: error.code, message: error.message }) }
  }
  return { success: true }
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(({ data }) => loginHandler(data, { supabase: createSupabaseServerClient() }))
