# env.ts

`src/lib/supabase/env.ts`

## 概要

Supabase に接続するために必要な2つの環境変数（`VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY`）を読み取り、Zod で検証して返す、Phase 4（認証）の入口となるファイルです。

この2つはどちらもブラウザに公開して問題ない値（安全境界は RLS 側）ですが、設定漏れや typo に気づかず起動すると、実行時のどこか遠くで「fetch failed」のような分かりにくいエラーになります。ここで早めに検証し、日本語で分かりやすいエラーメッセージを出すことで、設定ミスの原因をその場で特定できるようにしています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `SupabaseEnv` | interface（export） | `getSupabaseEnv` の戻り値の形 |
| `getSupabaseEnv` | function（export） | 環境変数を読み取り検証して返す。不正なら例外を投げる |

## コード解説

```ts
const envSchema = z.object({
  VITE_SUPABASE_URL: z.url({ error: 'VITE_SUPABASE_URL は URL 形式で設定してください' }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY を設定してください'),
})
```

Zod 4 系では `z.string().url()` ではなく `z.url()` というトップレベル関数に変わっています（`z.email()` も同様）。 URL として不正な値と、空文字のキーをそれぞれ個別のメッセージで拒否します。

```ts
export function getSupabaseEnv(): SupabaseEnv {
  const parsed = envSchema.safeParse(import.meta.env)
  if (!parsed.success) {
    throw new Error(
      `Supabase の環境変数が正しく設定されていません。.env を確認してください: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    )
  }
  return {
    url: parsed.data.VITE_SUPABASE_URL,
    publishableKey: parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
}
```

`import.meta.env` はオブジェクトなので、丸ごと `envSchema.safeParse()` に渡せます（余分なキーは Zod のデフォルト挙動で無視されます）。検証に失敗したら、どの項目がどう不正だったかを1つのエラーメッセージにまとめて例外を投げます。

**なぜモジュールスコープの定数にしないか。** `import.meta.env.VITE_*` は Vite がビルド時に静的な文字列へ置き換えるため、 `process.env` のように Cloudflare Workers のリクエストごとの注入を待つ必要はありません。それでも関数として実装しているのは、テストから `vi.stubEnv()` で異なる環境変数の組み合わせを毎回差し替えて検証できるようにするためです。モジュールスコープで一度だけ評価してしまうと、最初に読み込んだ環境変数の値がテスト全体に固定されてしまいます。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/lib/supabase/env.ts*
