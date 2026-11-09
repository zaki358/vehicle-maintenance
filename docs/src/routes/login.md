# login.tsx

`src/routes/login.tsx`

## 概要

メールアドレスとパスワードを入力してログインするページです。 `/_authed` ガード（`requireUser`）に弾かれた未ログインの利用者が最終的に辿り着く場所でもあります。

検証は2段階になっています。まずブラウザ側で `loginSchema` （Zod）を使って即座にフィードバックを返し、サーバーへは送りません。通過したら `loginFn`（サーバー関数）を呼びますが、その入り口でも同じ `loginSchema` が再度検証します（CLAUDE.md の方針「全書き込みはサーバー関数の入口で Zod 検証する」）。クライアント側の検証はあくまで UX のためのショートカットで、安全境界はサーバー関数側の検証です。

**Phase 8のセキュリティレビューで、`?redirect=` パラメータに絶対URL（`https://evil.example.com`）を仕込まれるとログイン成功直後に外部サイトへ強制遷移させられる「オープンリダイレクト」の脆弱性が見つかり、修正しました。** `loginSearchSchema` に `isSafeRedirectPath` （[`src/lib/url/safe-redirect.ts`](../lib/url/safe-redirect.md)）によるサニタイズを追加し、安全な相対パスでなければ既定の遷移先（`'/'`）にフォールバックするようにしています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `loginSearchSchema` | const | URL クエリ `?redirect=` を検証し、安全な相対パスでなければ `undefined` に落とす Zod スキーマ |
| `Route` | const（export） | `/login` ルートの定義 |
| `LoginPage` | function（component） | フォームの状態管理と送信処理 |

## コード解説

```tsx
const loginSearchSchema = z.object({
  redirect: z
    .string()
    .transform((value) => (isSafeRedirectPath(value) ? value : undefined))
    .optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})
```

`validateSearch` により、このルートの URL クエリパラメータが型安全になります。`_authed.tsx` の `requireUser` が投げるリダイレクトの `search: { redirect: redirectTo }` を受け取るための宣言です。

`redirect` はアプリ内部（`requireUser`）だけでなく、 URL を直接いじる第三者からも差し込める値です。`.transform()` で `isSafeRedirectPath` によるチェックを通し、安全な相対パス（`/` で始まり、`//` にも `/\` にもならない）でなければ黙って `undefined` に落とします。`.refine()` で例外を投げる方式にしなかったのは、不正な値が来てもルート自体は普通に表示させたい（エラー画面にしたくない）ためです。

```tsx
const parsed = loginSchema.safeParse({ email, password })
if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? '入力内容を確認してください')
  return
}

setError(null)
setSubmitting(true)
try {
  const result = await loginFn({ data: parsed.data })
  if (!result.success) {
    setError(result.error)
    return
  }
  await navigate({ href: redirect ?? '/', replace: true })
} finally {
  setSubmitting(false)
}
```

`loginSchema` は `features/auth/lib/login-schema.ts` （純粋関数）と共有しています。同じ検証ルールをクライアントとサーバーの両方に実装し直すのではなく、1つのスキーマを両側から呼ぶことでズレを防いでいます。

`navigate({ href: redirect ?? '/', ... })` で `to` ではなく `href` を使っているのは、 `redirect` が「型システムが知っているルート一覧のどれか」ではなく、実行時に決まる任意の文字列だからです。`href` は TanStack Router が型安全性を諦めて任意の文字列パスへ遷移するためのエスケープハッチとして用意しているオプションです。`href` に絶対URLを渡すと TanStack Router はフルページ遷移（`window.location.href`）にフォールバックするため、以前はここが正にオープンリダイレクトの入口でした。上の `loginSearchSchema` が既に安全な相対パスであることを保証しているので、この `href` は今は安全です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/login.tsx*
