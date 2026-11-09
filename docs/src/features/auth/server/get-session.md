# get-session.ts

`src/features/auth/server/get-session.ts`

## 概要

「今、誰がログインしているか」を返すサーバー関数です。ルートの `beforeLoad`（`_authed.tsx`）から呼ばれ、その結果を `require-user.ts` の `requireUser()` に渡してログインガードを構成します。

`getSession()` ではなく `getClaims()` を使っているのがこの実装の要点です。`getSession()` は Cookie に入っている値をそのまま返すだけで、サーバー側では署名を検証しません。一方 `getClaims()` は JWT の署名を WebCrypto でその場で検証するため、改ざんされた Cookie を信頼してしまう心配がなく、しかもネットワーク往復も発生しません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `getSessionHandler` | function（export） | 依存を注入できる実処理本体。ユニットテストはこちらを直接呼ぶ |
| `getSessionFn` | const（export） | `createServerFn` で包んだ、ルート/クライアントから呼べる形 |

## コード解説

```ts
export async function getSessionHandler(deps: GetSessionDeps): Promise<AuthedUser | null> {
  const { data, error } = await deps.supabase.auth.getClaims()
  if (error || !data) {
    return null
  }
  return { id: data.claims.sub, email: data.claims.email ?? null }
}

export const getSessionFn = createServerFn({ method: 'GET' }).handler(() =>
  getSessionHandler({ supabase: createSupabaseServerClient() }),
)
```

実処理を `getSessionHandler` という単独の関数として切り出し、 Supabase クライアントを `deps` 引数で受け取る形にしています。テストからは `auth.getClaims` だけを持つ最小限のフェイクを直接渡せます。これにより、実際の Supabase ネットワーク通信を一切発生させずに「クレームが取れた／エラーだった／未ログインだった」の3パターンを検証できます。

`error || !data` の条件は、`getClaims()` の戻り値の型が 3パターン（成功／エラー／「エラーは無いがデータも無い」＝単純な未ログイン）存在することに対応しています。いずれの場合も呼び出し側からは同じ `null` として扱えるようにしています。

**`deps` にデフォルト値を持たせていない理由。** 当初は `deps: GetSessionDeps = { supabase: createSupabaseServerClient() }` という書き方にしていましたが、これだと TanStack Start のビルドが「サーバー専用 import をクライアント環境に混入させるな」という import-protection エラーで失敗しました。`_authed.tsx` （クライアントにもバンドルされるルートファイル）が `getSessionFn` を使うために `get-session.ts` を import すると、デフォルト値として書かれた `createSupabaseServerClient`（`@tanstack/react-start/server` に依存）への参照が、モジュールのトップレベルから静的に見えてしまうためです。 `deps` を必須にし、`createSupabaseServerClient()` の呼び出しを `getSessionFn` の `.handler()` コールバックの中だけに押し込めることで、クライアントバンドル生成時にこの部分だけを安全に除外できるようになりました。

```ts
interface GetSessionDeps {
  supabase: { auth: Pick<SupabaseClient<Database>['auth'], 'getClaims'> }
}
```

依存の型は「`SupabaseAuthClient` 全体」ではなく、実際に使う `getClaims` メソッド1つだけを `Pick` で取り出しています。こうしないと、テスト用のフェイクオブジェクトは `SupabaseAuthClient` が持つ100件以上のメソッド・プロパティをすべて実装しなければコンパイルが通らなくなってしまいます。

```ts
export const getSessionFn = createServerFn({ method: 'GET' }).handler(() => getSessionHandler())
```

`createServerFn` でラップした薄い配線です。テストはこちらを通しません（TanStack Start のサーバー関数呼び出し機構そのものはユニットテストの対象外で、E2E やブラウザでの手動確認で検証する層）。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/auth/server/get-session.ts*
