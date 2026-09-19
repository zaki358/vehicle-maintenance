import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'

import { getSupabaseEnv } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/database.types'

/**
 * サーバー用 Supabase クライアントを、呼び出すたびに新しく作って返す関数。
 *
 * **絶対にモジュールスコープでメモ化しないこと。** Cloudflare Workers は
 * isolate を複数リクエストにまたいで再利用するため、ここをキャッシュすると
 * 前のリクエストのユーザーのセッションを次のリクエストが引き継いでしまう
 * （このスタック最悪のバグ。ローカル開発やテスター1人では絶対に再現しない）。
 * そのため export しているのは値ではなく、呼ぶたびにクライアントを
 * 組み立てる関数そのもの。
 *
 * TanStack Start の `getCookies`/`setCookie` はリクエストスコープの
 * コンテキストから読み書きするため、Request/Response を引数で
 * 受け渡す必要はない。
 */
export function createSupabaseServerClient() {
  const env = getSupabaseEnv()
  return createServerClient<Database>(env.url, env.publishableKey, {
    // httpOnly は意図的に既定値(false)のまま（招待リンクのハッシュフラグメント
    // 検出やトークンリフレッシュに必要）。その代わり secure は明示的に立てて、
    // 平文HTTP経由でのCookie送信を防ぐ多層防御にする。
    cookieOptions: { secure: true },
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options)
        }
      },
    },
  })
}
