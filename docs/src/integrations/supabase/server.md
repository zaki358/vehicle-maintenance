# server.ts

`src/integrations/supabase/server.ts`

## 概要

サーバー側（TanStack Start のサーバー関数・SSR）で使う Supabase クライアントを作る、このプロジェクトで最もリスクが高いファイルです。実装プランで「このスタック最悪のバグ」と名指しされている落とし穴 — サーバー用クライアントをモジュールスコープでメモ化すると、Cloudflare Workers の isolate 再利用によって**別人のセッションを掴んでしまう** — を避けるため、値ではなく「呼ぶたびに新しいクライアントを組み立てる関数」を exportしています。

Cookie の読み書きは TanStack Start の `getCookies`/`setCookie` （リクエストスコープのコンテキストから読み書きするため、Request/Response を引数で受け渡す必要がない）を、Supabase が要求する `getAll`/`setAll` の形に変換して橋渡ししています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `createSupabaseServerClient` | function（export） | リクエストごとに新しいサーバー用 Supabase クライアントを作って返す |

## コード解説

```ts
export function createSupabaseServerClient() {
  const env = getSupabaseEnv()
  return createServerClient<Database>(env.url, env.publishableKey, {
    cookieOptions: { secure: true },
    cookies: { ... },
  })
}
```

トップレベルに `const client = createServerClient(...)` のような変数が一切無いことに注目してください。この関数を呼ぶ側（`features/auth/server/*` の各サーバー関数）は、処理のたびに必ずこの関数を呼び直します。1つのインスタンスを使い回すコードはどこにも存在しません。

```ts
getAll() {
  return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
},
```

TanStack Start の `getCookies()` は `{ 名前: 値 }` という Record を返しますが、Supabase の `getAll` は `{ name, value }[]` という配列を要求します。この変換だけを行う薄いアダプタです。

```ts
setAll(cookiesToSet) {
  for (const { name, value, options } of cookiesToSet) {
    setCookie(name, value, options)
  }
},
```

ログイン・ログアウト・トークンのリフレッシュが起きるたびに、Supabase は更新後の Cookie 一覧を `setAll` に渡してきます。1件ずつ TanStack Start の `setCookie` に橋渡しするだけで、 `httpOnly` などのオプションはそのまま素通りします。呼び出し側（`login.ts` など）がこの配線を意識する必要は一切ありません — `supabase.auth.signInWithPassword()` を呼べば、Cookie はこのクライアントが自動的に書き込みます。

**`httpOnly` はあえて指定せず、`@supabase/ssr` のデフォルト（`false`）のままにしています。** 「セッション Cookie は httpOnly にすべき」という一般的なセキュリティ知識とは逆に見えますが、Supabase 公式ドキュメント（Auth Server-Side Rendering / Advanced guide）が明示的に「不要」としている設計です。理由は、ブラウザ側の Supabase クライアント（`client.ts`）がセッションのリフレッシュトークンを自分で読み書きしてセッションを維持する構成になっているため。 httpOnly にしてしまうとブラウザ側クライアントが Cookie を一切読めなくなり、トークンのリフレッシュや `set-password.tsx` の招待リンク処理（`detectSessionInUrl`）が壊れます。

**Phase 8のセキュリティレビューで、`secure` 属性も指定されていないことが指摘され、`cookieOptions: { secure: true }` を追加しました。** `httpOnly` をあえて外している設計だからこそ、 `secure` は多層防御として必ず立てるべき、という判断です。 `secure: true` にすると Cookie は HTTPS 接続でしか送信されなくなり、平文HTTP経由での盗聴・改ざんを防ぎます。`localhost` は主要ブラウザが「安全なコンテキスト」として特別扱いするため、 `vite dev`（HTTP）でのログイン動作には影響しません。本番の Cloudflare Workers は常にHTTPSなので、こちらも問題ありません。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/integrations/supabase/server.ts*
