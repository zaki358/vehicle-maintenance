# client.ts

`src/integrations/supabase/client.ts`

## 概要

ブラウザ（クライアントサイド）で使う Supabase クライアントを作る、唯一の場所です。 `@supabase/ssr` の `createBrowserClient` を、モジュールスコープの変数でシングルトンとしてキャッシュして返します。

`src/lib/supabase/` ではなく `src/integrations/supabase/` に置いているのは、`src/**/lib/**` に適用される ESLint の境界ルール（React・TanStack・Supabase の import 禁止）と、このファイルが `@supabase/ssr` を import する必要があることが両立しないためです。「外部 SDK をこのアプリに配線する」層として、TanStack Start の作例にならい `integrations/` を新設しました。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `getSupabaseBrowserClient` | function（export） | ブラウザ用 Supabase クライアントのシングルトンを返す |

## コード解説

```ts
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getSupabaseEnv()
    browserClient = createBrowserClient<Database>(env.url, env.publishableKey)
  }
  return browserClient
}
```

初回呼び出し時だけ `createBrowserClient` を実行し、以降はモジュールスコープに保持した同じインスタンスを返します。 `Database`（生成済みの `database.types.ts`）を型引数に渡すことで、 `.from('vehicles')` のようなクエリがテーブル名・カラム名まで型チェックされるようになります。

**なぜサーバー用（`server.ts`）と違ってシングルトンにしてよいか。** ブラウザの1つのタブ・1つのモジュールインスタンスは、常に1人の利用者に紐づきます。サーバー用クライアントをメモ化してはいけない理由（Cloudflare Workers の isolate 再利用で他人のセッションを掴む）は、ブラウザには存在しません。むしろ、リクエストのたびに新しいクライアントを作ると Supabase の内部状態（auth のイベントリスナーなど）が無駄に重複するため、シングルトンが正しい選択です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/integrations/supabase/client.ts*
