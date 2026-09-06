/**
 * Supabase Auth の AuthError を構造的に受け取るための最小限の型。
 * `@supabase/supabase-js` 自体を import すると lib 層の境界ルールに違反するため、
 * 呼び出し側で `{ code: error.code, message: error.message }` の形に変換して渡す。
 */
type AuthErrorLike = {
  code?: string
  message: string
}

const GENERIC_MESSAGE = 'エラーが発生しました。時間をおいて再度お試しください'

/**
 * Supabase Auth のエラーコードから、日本語の利用者向けメッセージへ変換する。
 *
 * `invalid_credentials` と `user_not_found` を同じ文言にしているのは、
 * 「そのメールアドレスは登録されていません」のように出し分けると、
 * 第三者が招待済みメールアドレスを詮索できてしまうため(ユーザー列挙対策)。
 */
export function authErrorMessage(error: AuthErrorLike): string {
  switch (error.code) {
    case 'invalid_credentials':
    case 'user_not_found':
      return 'メールアドレスまたはパスワードが正しくありません'
    case 'email_not_confirmed':
      return 'メールアドレスの確認が完了していません'
    case 'user_banned':
      return 'このアカウントは無効化されています'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'しばらく時間をおいてから再度お試しください'
    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
      return 'セッションの有効期限が切れました。再度ログインしてください'
    case 'weak_password':
      return 'パスワードが簡単すぎます。別のパスワードを設定してください'
    case 'same_password':
      return '新しいパスワードは現在のパスワードと異なるものにしてください'
    default:
      return GENERIC_MESSAGE
  }
}
