# auth-errors.ts

`src/features/auth/lib/auth-errors.ts`

## 概要

Supabase Auth（`@supabase/auth-js`）が返すエラーコードを、ログイン画面や `/set-password` 画面にそのまま表示できる日本語メッセージへ変換する純粋関数です。Supabase の `AuthError` は英語の `message`（例: `"Invalid login credentials"`）をそのまま表示すると利用者に不親切なため、この変換が必要になります。

`src/**/lib/**` は `@supabase/*` を import できない境界ルール（`CLAUDE.md`）があるため、実際の `AuthError` 型は使わず、必要なフィールドだけを持つ構造的な型（`AuthErrorLike`）で受け取ります。呼び出し側（サーバー関数）が `{ code: error.code, message: error.message }` の形に詰め替えてから渡す想定です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `AuthErrorLike` | type | Supabase の AuthError から必要な形だけを取り出した型（非export） |
| `authErrorMessage` | function（export） | エラーコードから日本語メッセージへ変換する |

## コード解説

```ts
type AuthErrorLike = {
  code?: string
  message: string
}
```

`code` は省略可能です。`@supabase/auth-js` の型定義上も、レスポンスを受け取る前に発生するエラー（ネットワーク断など）では `code` が付かないことがあるため、そのケースも扱えるようにしています。

```ts
export function authErrorMessage(error: AuthErrorLike): string {
  switch (error.code) {
    case 'invalid_credentials':
    case 'user_not_found':
      return 'メールアドレスまたはパスワードが正しくありません'
    ...
    default:
      return GENERIC_MESSAGE
  }
}
```

**ユーザー列挙対策** — `invalid_credentials` （パスワードが違う）と `user_not_found`（そのメールアドレスのアカウントが無い）を、あえて同じ文言にしています。別々のメッセージにすると、第三者が「このメールアドレスは登録されているか」を総当たりで調べられてしまいます（ユーザー列挙攻撃）。このアプリは公開サインアップが無く、招待されたメールアドレスの一覧そのものが非公開情報であるため、特に重要な対策です。

**関連コードのグルーピング** — `over_request_rate_limit` と `over_email_send_rate_limit`、および `session_expired` / `session_not_found` / `refresh_token_not_found` / `refresh_token_already_used` は、利用者からは区別する意味が無い（どれも「もう一度ログインし直す」という同じアクションにつながる）ため、`switch` のフォールスルーでまとめて同じメッセージに寄せています。

**メールリンクの失効** — `otp_expired` は、招待・パスワード再設定メールのリンクが期限切れ、または既に使用済みのときに返ります。リンクは一度きりの使い捨てなので、メールアプリのプレビューやセキュリティソフトが先に開いただけでも消費されます。利用者が自分で操作した覚えがなくても起こりうるため、文言は「もう一度メールを送ってもらってください」という次の行動を示す形にしています。この値は `parse-auth-hash.ts` が URL ハッシュから取り出し、`/set-password` 画面が渡してきます。

**フォールバック** — `Supabase Auth` のエラーコード一覧（`error-codes.ts`）には MFA・SSO・電話認証など、このアプリでは使わない機能のコードも多数含まれます。それらや将来追加される未知のコードは、すべて `default` の汎用メッセージに落とします。エラーメッセージが内部実装の詳細を漏らさないようにする、というセキュリティ上の方針にも沿っています。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/auth/lib/auth-errors.ts*
