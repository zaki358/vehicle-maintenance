# \_authed.tsx

`src/routes/_authed.tsx`

## 概要

ログイン必須のページをまとめる TanStack Router の「レイアウトルート」です。ファイル名の先頭の `_` は、URL には一切現れない特殊なルートであることを表す TanStack Router の命名規約。将来 `routes/_authed.vehicles.tsx` のような子ルートを追加すると、URL は `/vehicles` のままで、このファイルの `beforeLoad` だけを必ず通過するようになります。

認証ガードそのもののロジックは持たず、「セッションを取得する」（`getSessionFn`）と「取得結果に応じて処理を分岐する」（`requireUser`）という、すでに個別にテスト済みの2つの部品を 1行でつなぐだけの薄いファイルです。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/_authed` レイアウトルートの定義 |

## コード解説

```tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getSessionFn()
    return { user: requireUser(user, location.href) }
  },
  component: () => <Outlet />,
})
```

`beforeLoad` は、このレイアウトの配下にあるどのページへ遷移するときも必ず最初に実行されます。`getSessionFn()` で現在のログイン状態を取得し、`requireUser()` に渡します。ユーザーがいなければ `requireUser` が `/login` へのリダイレクトを投げ、この `beforeLoad` の実行はそこで打ち切られます（レンダリングまで到達しません）。

`location.href`（現在アクセスしようとしていた URL）を `requireUser` に渡しているのは、ログイン画面の `?redirect=` クエリに使うためです。未ログインで `/vehicles/xxx` を直接開こうとした場合、ログイン成功後にダッシュボードではなく `/vehicles/xxx` へ戻せます。

`beforeLoad` が返す `{ user }` は、この配下の全ルートの `context` に合流します。`_authed.index.tsx` が `Route.useRouteContext()` で `user` を取り出せるのはこのためです。

`component: () => <Outlet />` は、それ自体は何も描画せず、子ルート（`_authed.index.tsx` など）の内容をそのまま表示するだけの器です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/\_authed.tsx*
