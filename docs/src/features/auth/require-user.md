# require-user.ts

`src/features/auth/require-user.ts`

## 概要

ルートの `beforeLoad` から呼び出し、「ログイン済みユーザーがいなければ `/login` へリダイレクトする」という分岐だけを担当するヘルパーです。「現在のセッションを取得する」処理（`server/get-session.ts`、DB へ問い合わせる）と「取得結果に応じてどう振る舞うか」（このファイル、分岐だけ）を分離しているため、 DB もルーターの実インスタンスも無しに、この分岐ロジック単体をテストできます。

**これはあくまで UX のためのガードであり、セキュリティ境界ではない。** 本当の安全境界は Supabase の RLS（`auth.uid() = user_id`）。ここを迂回して直接サーバー関数やルートへリクエストされても、 RLS が他人のデータへのアクセスをデータベース側で拒む。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `AuthedUser` | interface（export） | ログイン済みユーザーの最小限の形（id・email） |
| `requireUser` | function（export） | ユーザーが null ならリダイレクトを投げ、いればそのまま返す |

## コード解説

```ts
export function requireUser(user: AuthedUser | null, redirectTo: string): AuthedUser {
  if (!user) {
    throw redirect({ to: '/login', search: { redirect: redirectTo } })
  }
  return user
}
```

`user` が `null`（未ログイン）なら、TanStack Router の `redirect()` が返す「リダイレクトを表す特別な Response」を `throw` します。TanStack Router はルートの `beforeLoad` 内で投げられたこの特別な例外を検知して、実際のブラウザナビゲーションに変換します。

`search: { redirect: redirectTo }` でログイン後に戻るべき URL をクエリパラメータとして持たせています。`/login` 画面はログイン成功時にこの値を読み、ダッシュボードではなく元々アクセスしようとしていたページへ利用者を送り返せます（例: `/vehicles/xxx` を開こうとして未ログインだった場合、ログイン後は `/vehicles/xxx` に戻る）。

`user` があればそのまま返します。戻り値の型が `AuthedUser`（`| null` を含まない）であることにより、呼び出し側はこれ以降 `null` チェックを書かずにユーザー情報を扱えます。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/auth/require-user.ts*
