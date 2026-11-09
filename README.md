# vehicle-maintenance

車とバイクのメンテナンス記録 Web アプリ（TanStack Start / Supabase / Cloudflare Workers）。

## ドキュメント

- [プロジェクト解説・ファイル別目次](docs/README.md) — アプリ概要・機能・使用技術・フォルダ構成
- [アーキテクチャ解説](docs/architecture.md) — Cloudflare Workers と Supabase の繋がり、認証・招待の流れ

`docs/` には同じ内容の HTML 版（ブラウザ表示用）と Markdown 版（GitHub 表示用）があります。
Markdown 版は HTML から `node tools/html-docs-to-md.mjs` で生成しています。

## 開発

```bash
npm install
npm run dev
```

Edit `src/routes/index.tsx` to get started. Add route files under
`src/routes`; TanStack Router updates `src/routeTree.gen.ts` for you.

Build the production app with:

```bash
npm run build
```

## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Install Wrangler: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy: `npx wrangler deploy`

For production env vars, run `wrangler secret put MY_VAR` for each secret listed in `.env.example`. Public (non-secret) vars go in `wrangler.jsonc` under `vars`.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc` — see https://developers.cloudflare.com/workers/wrangler/configuration/.


