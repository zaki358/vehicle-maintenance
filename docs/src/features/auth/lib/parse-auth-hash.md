# parse-auth-hash.ts

`src/features/auth/lib/parse-auth-hash.ts`

## 概要

招待メール・パスワード再設定メールのリンクを踏んだあと、ブラウザが戻ってくる URL の `#` 以降（ハッシュフラグメント）を解析する純粋関数です。 `#access_token=...&refresh_token=...` という形でセッションのトークンが渡されるので、それを取り出して `/set-password` 画面が `supabase.auth.setSession()` に渡せる形にします。

この関数が必要になる理由は、`@supabase/ssr` の `createBrowserClient` が `flowType` を `"pkce"` に固定しているためです。Supabase ダッシュボードや `admin.inviteUserByEmail()` が送るメールのリンクは、PKCE ではなく implicit フロー形式（ハッシュにトークンを載せる方式）で戻ってきます。 PKCE 固定のクライアントはこの形式を「PKCE の URL ではない」として拒否し、 `detectSessionInUrl` による自動取り込みが働きません。そこで、アプリ側で明示的にハッシュを読み取る必要があります。

リンクが期限切れ・使用済みのときは、トークンの代わりに `#error=access_denied&error_code=otp_expired&...` が付いて戻ってくるため、その場合はエラーコードを返して画面側で案内を出せるようにしています。`src/**/lib/**` の境界ルール（`CLAUDE.md`）に従い、このファイルは React も Supabase も import しません。入力は文字列、出力はプレーンなオブジェクトだけです。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `AuthHashResult` | type（export） | 解析結果を表す3択の判別可能ユニオン（トークンあり／エラー／該当なし） |
| `parseAuthHash` | function（export） | URL ハッシュ文字列を `AuthHashResult` に変換する |

## コード解説

```ts
export type AuthHashResult =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'error'; code: string }
  | { kind: 'none' }
```

戻り値を判別可能ユニオン（discriminated union）にしています。 `kind` を見れば呼び出し側の分岐が尽くされているかを TypeScript が検査できるため、「エラーのときの処理を書き忘れる」といった漏れを型で防げます。

3つの状態はそれぞれ、`tokens` = 有効なリンクから戻ってきた、 `error` = 期限切れなどでリンクが無効だった、 `none` = そもそもメールのリンク経由ではない（直接 URL を開いた、など）を表します。`none` と `error` を分けているのは、利用者に出すべき案内文が違うからです。

```ts
const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
```

ハッシュの中身は `a=1&b=2` という、クエリ文字列と同じ形式です。そのため `URLSearchParams` をそのまま使えます。パーセントエンコードの解除（例: `Email+link+is+invalid`）も任せられます。

先頭の `#` は `window.location.hash` から取ると付いてきますが、文字列を組み立てて渡す場合は付かないこともあります。どちらでも動くように入口で吸収しています。

```ts
if (params.has('error') || params.has('error_code')) {
  return { kind: 'error', code: params.get('error_code') || 'unknown' }
}
```

エラー判定をトークン取得より先に行います。Supabase は失敗時に `error` / `error_code` / `error_description` を返し、トークンは付けません。

`error_code` が無いエラー（将来の仕様変更や想定外のケース）は `'unknown'` にまとめます。呼び出し側は `authErrorMessage()` に渡すだけでよく、未知のコードは自動的に汎用メッセージへ落ちます。

```ts
const accessToken = params.get('access_token')
const refreshToken = params.get('refresh_token')
if (!accessToken || !refreshToken) {
  return { kind: 'none' }
}
return { kind: 'tokens', accessToken, refreshToken }
```

2つのトークンが**両方そろっている場合だけ** `tokens` を返します。`setSession()` は `access_token` と `refresh_token` の両方を要求し、片方だけでは必ず失敗するためです。片方しか無い中途半端な状態は、呼び出し側から見れば「リンク経由ではない」のと同じ扱いで問題ありません。

`!accessToken` という真偽値チェックにしているのは、 `null`（キーが無い）に加えて空文字（`access_token=`）も同時に弾くためです。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/auth/lib/parse-auth-hash.ts*
