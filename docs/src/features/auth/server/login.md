# login.ts

`src/features/auth/server/login.ts`

## 概要

メールアドレスとパスワードでログインするサーバー関数です。 `loginSchema`（Zod）で入力を検証してから Supabase の `signInWithPassword` を呼び、失敗時は `auth-errors.ts` の `authErrorMessage` で日本語のメッセージに変換して返します。

Cookie への書き込みはこのファイルの責務ではありません。 `createSupabaseServerClient()` が組み立てるクライアントは `cookies.setAll` を持っているため、`signInWithPassword` の呼び出し中に Supabase 側が自動的にセッション Cookie を書き込みます。このファイルはログインの成否だけを気にすればよい設計です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `LoginResult` | type（export） | 成功 `{ success: true }` か、失敗 `{ success: false, error }` の判別可能な union |
| `loginHandler` | function（export） | 依存を注入できる実処理本体 |
| `loginFn` | const（export） | `createServerFn` で包み、Zod 検証を挟んだサーバー関数 |

## コード解説

```ts
export async function loginHandler(input: LoginInput, deps: LoginDeps): Promise<LoginResult> {
  const { error } = await deps.supabase.auth.signInWithPassword(input)
  if (error) {
    return { success: false, error: authErrorMessage({ code: error.code, message: error.message }) }
  }
  return { success: true }
}
```

`deps` は必須引数で、デフォルト値を持ちません。理由は `get-session.ts` と同じ import-protection 対策です（`createSupabaseServerClient()` の呼び出しは、下の `loginFn` の `.handler()` コールバックの中だけに押し込めています）。

`get-session.ts` と同じ「`deps` 注入で依存を差し替え可能にする」パターンです。`authErrorMessage` は `@supabase/*` を import しない純粋関数（`lib/` 層）なので、 Supabase の `AuthError` をそのまま渡さず `{ code, message }` の最小限の形に変換して渡しています。

`invalid_credentials` と `user_not_found` を `authErrorMessage` 側で同じ文言にまとめているのは、「そのメールアドレスは登録されていません」と個別に出し分けると第三者が招待済みメールアドレスを詮索できてしまうため（ユーザー列挙対策。公開サインアップを無効化している設計と対をなす）。

```ts
export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(({ data }) => loginHandler(data, { supabase: createSupabaseServerClient() }))
```

`.validator(loginSchema)` に Zod スキーマをそのまま渡せます。 Zod 4 はスキーマが Standard Schema （`~standard` プロパティを持つ共通インターフェース）を実装しているため、 TanStack Start 側で追加の変換コードを書く必要がありません。ここが「全書き込みはサーバー関数の入口で Zod 検証する」というプロジェクトの方針の実体です — クライアント側のフォームバリデーションを経由せず直接この関数が叩かれても、不正な入力はここで弾かれます。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/auth/server/login.ts*
