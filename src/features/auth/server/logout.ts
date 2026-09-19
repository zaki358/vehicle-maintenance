import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

interface LogoutDeps {
  supabase: { auth: Pick<SupabaseClient<Database>['auth'], 'signOut'> }
}

/**
 * ログアウトする。Cookie の削除は `signOut()` 呼び出し中に
 * サーバー用クライアントの `cookies.setAll` が自動的に行う。
 *
 * `deps` を必須にしている理由は `get-session.ts` と同じ（import-protection 対策）。
 */
export async function logoutHandler(deps: LogoutDeps): Promise<void> {
  await deps.supabase.auth.signOut()
}

export const logoutFn = createServerFn({ method: 'POST' }).handler(() =>
  logoutHandler({ supabase: createSupabaseServerClient() }),
)
