export type AuthHashResult =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'error'; code: string }
  | { kind: 'none' }

/**
 * 招待・パスワード再設定リンクから戻ってきた URL ハッシュを解析する。
 *
 * ダッシュボードや `admin.inviteUserByEmail()` が送るリンクは implicit フロー形式
 * (`#access_token=...&refresh_token=...`) で戻ってくるが、`@supabase/ssr` の
 * ブラウザクライアントは flowType を pkce に固定しており、このハッシュを自動では
 * 取り込まない。そのため呼び出し側で `setSession()` に渡すためにここで取り出す。
 */
export function parseAuthHash(hash: string): AuthHashResult {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)

  if (params.has('error') || params.has('error_code')) {
    return { kind: 'error', code: params.get('error_code') || 'unknown' }
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) {
    return { kind: 'none' }
  }
  return { kind: 'tokens', accessToken, refreshToken }
}
