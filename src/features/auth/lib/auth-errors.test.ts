import { describe, expect, it } from 'vitest'

import { authErrorMessage } from './auth-errors'

describe('authErrorMessage', () => {
  it('invalid_credentials は「メールアドレスまたはパスワードが正しくありません」', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'メールアドレスまたはパスワードが正しくありません',
    )
  })

  it('user_not_found も invalid_credentials と同じ文言にする(存在するメールアドレスの詮索を防ぐため)', () => {
    expect(authErrorMessage({ code: 'user_not_found', message: 'User not found' })).toBe(
      'メールアドレスまたはパスワードが正しくありません',
    )
  })

  it('email_not_confirmed は確認メール未完了の案内にする', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' })).toBe(
      'メールアドレスの確認が完了していません',
    )
  })

  it('user_banned はアカウント無効化の案内にする', () => {
    expect(authErrorMessage({ code: 'user_banned', message: 'User is banned' })).toBe(
      'このアカウントは無効化されています',
    )
  })

  it('over_request_rate_limit はレート制限の案内にする', () => {
    expect(authErrorMessage({ code: 'over_request_rate_limit', message: 'rate limited' })).toBe(
      'しばらく時間をおいてから再度お試しください',
    )
  })

  it('over_email_send_rate_limit もレート制限の案内にする', () => {
    expect(authErrorMessage({ code: 'over_email_send_rate_limit', message: 'rate limited' })).toBe(
      'しばらく時間をおいてから再度お試しください',
    )
  })

  it('session_expired はセッション切れの案内にする', () => {
    expect(authErrorMessage({ code: 'session_expired', message: 'Session expired' })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください',
    )
  })

  it('session_not_found もセッション切れと同じ案内にする', () => {
    expect(authErrorMessage({ code: 'session_not_found', message: 'Session not found' })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください',
    )
  })

  it('refresh_token_not_found もセッション切れと同じ案内にする', () => {
    expect(authErrorMessage({ code: 'refresh_token_not_found', message: 'no refresh token' })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください',
    )
  })

  it('refresh_token_already_used もセッション切れと同じ案内にする', () => {
    expect(authErrorMessage({ code: 'refresh_token_already_used', message: 'reused' })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください',
    )
  })

  it('weak_password はパスワード強度不足の案内にする', () => {
    expect(authErrorMessage({ code: 'weak_password', message: 'weak' })).toBe(
      'パスワードが簡単すぎます。別のパスワードを設定してください',
    )
  })

  it('same_password は現在と異なるパスワードを促す案内にする', () => {
    expect(authErrorMessage({ code: 'same_password', message: 'same' })).toBe(
      '新しいパスワードは現在のパスワードと異なるものにしてください',
    )
  })

  it('otp_expired はメールリンクの期限切れ案内にする', () => {
    expect(authErrorMessage({ code: 'otp_expired', message: 'Email link is invalid or has expired' })).toBe(
      'メールのリンクが無効か期限切れです。もう一度メールを送ってもらってください',
    )
  })

  it('未知の code は汎用エラーメッセージにする', () => {
    expect(authErrorMessage({ code: 'unexpected_failure', message: 'boom' })).toBe(
      'エラーが発生しました。時間をおいて再度お試しください',
    )
  })

  it('code が無い場合(ネットワークエラー等)も汎用エラーメッセージにする', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toBe(
      'エラーが発生しました。時間をおいて再度お試しください',
    )
  })
})
