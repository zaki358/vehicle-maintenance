import { createBrowserClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/database.types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * ブラウザ用 Supabase クライアントのシングルトンを返す。
 *
 * サーバー用（`server.ts`）とは対照的に、こちらはモジュールスコープで
 * メモ化してよい。ブラウザの1タブは常に1人のユーザーのものであり、
 * Cloudflare Workers の isolate 再利用のような「別人のセッションを
 * 掴む」リスクが存在しないため。
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getSupabaseEnv()
    browserClient = createBrowserClient<Database>(env.url, env.publishableKey)
  }
  return browserClient
}
