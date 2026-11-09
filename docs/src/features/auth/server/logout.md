# logout.ts

`src/features/auth/server/logout.ts`

## 概要

ログアウトするサーバー関数です。`login.ts` と対になる、このファイル群の中で最も単純なものです。入力を持たないため Zod 検証もなく、 `supabase.auth.signOut()` を呼ぶだけです。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `logoutHandler` | function（export） | 依存を注入できる実処理本体 |
| `logoutFn` | const（export） | `createServerFn` で包んだサーバー関数 |

## コード解説

```ts
export async function logoutHandler(deps: LogoutDeps): Promise<void> {
  await deps.supabase.auth.signOut()
}

export const logoutFn = createServerFn({ method: 'POST' }).handler(() =>
  logoutHandler({ supabase: createSupabaseServerClient() }),
)
```

`signOut()` 呼び出し中に、サーバー用クライアントの `cookies.setAll` が自動的にセッション Cookie を削除します。 `login.ts` と同じ理由で、Cookie 操作をこのファイルが直接意識する必要はありません。

`deps` が必須なのも `get-session.ts` と同じ import-protection 対策です。`createSupabaseServerClient()` は `.handler()` コールバックの中だけで呼んでいます。

テストは `logoutHandler` に対して、渡した `signOut` のフェイクが1回呼ばれることだけを確認しています。戻り値や分岐が無い関数なので、これで十分な検証です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/auth/server/logout.ts*
