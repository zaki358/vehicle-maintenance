# invite-user.ts

`scripts/invite-user.ts`

## 概要

公開サインアップを無効化しているこのアプリで、新しい利用者にアカウントを使ってもらうための唯一の手段——オーナーが自分の PC のターミナルで直接実行する、招待専用のスクリプトです。`src/` 配下のアプリケーションコードとは独立していて、Cloudflare Workers にはデプロイされません。

**Claude はこのスクリプトを実行しません。** 実行には `SUPABASE_SECRET_KEY`（service\_role 相当の強力な権限を持つシークレットキー）が必要で、これはプロジェクトの方針上 Claude が扱わない値だからです。`scripts/.env`（.gitignore 対象）にこの値を置き、オーナー自身が `node scripts/invite-user.ts <メールアドレス>` を実行します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `loadEnvFiles` | function | `.env` と `scripts/.env` を読み込む |
| `requireEnv` | function | 環境変数を読み、無ければ分かりやすいメッセージで例外を投げる |
| `main` | function | 引数を解釈し、招待メールを送信する本体 |

## コード解説

```ts
const email = process.argv[2]
if (!email) {
  console.error('使い方: node scripts/invite-user.ts <招待するメールアドレス> [招待後の遷移先URL]')
  process.exitCode = 1
  return
}
```

このプロジェクトにはビルドツールを追加していないため、 `tsx` のような別ツールを入れず、Node.js が標準で持つ TypeScript ファイルの直接実行機能（Node 22 以降）で `node scripts/invite-user.ts ...` とそのまま実行できるようにしています。

```ts
const projectLabel = supabaseUrl.includes(PRODUCTION_HOST) ? '本番' : '開発用'
console.log(`招待先プロジェクト: ${projectLabel}（${supabaseUrl}）`)
```

招待メールは実際に送信される、取り消しの効かない操作です。誤って開発用プロジェクトに向けて実行してしまう（あるいはその逆）事故を防ぐため、実行前に「今どちらのプロジェクトに向けて送ろうとしているか」を必ず画面に表示します。`scripts/tests/support/env.ts` （RLS 統合テスト）が本番プロジェクトへの実行を例外で強制的に止めるのに対し、こちらは意図的にブロックしません — 招待は最終的に本番プロジェクトへ送ることが目的の操作であるため、止めるのではなく「見える化」する設計です。

```ts
const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
```

`supabase.auth.admin.inviteUserByEmail()` は PKCE に対応していません（招待する側＝オーナーのブラウザと、リンクを踏む側＝招待された利用者のブラウザが異なるため、同一ブラウザ内でのコード検証を前提とする PKCE の安全性を担保できないと Supabase 公式ドキュメントが明記しています）。そのため招待メールのリンクは `#access_token=...&type=invite` というハッシュフラグメント形式になり、`routes/set-password.tsx` のブラウザ用クライアントがこれを自動検出してセッションを確立します。

`redirectTo` は Supabase ダッシュボードの **Authentication → URL Configuration → Redirect URLs** に事前に登録されている URL でなければ、リンクを踏んでもそこへ遷移しません。このスクリプトはその設定を確認する手段を持たないため、実行前にコンソールへ遷移先 URL を出力し、オーナー自身がダッシュボードの設定と見比べられるようにしています。

---

*生成日: 2026-09-19 ／ 対象ファイル: scripts/invite-user.ts*
