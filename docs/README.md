# 車両メンテナンス記録 — プロジェクト解説

*vehicle-maintenance — アプリ概要・機能・使用技術・フォルダ構成・ファイル一覧*

車とバイクの車検・整備記録を個人ごとに管理する Web アプリの解説ドキュメントです。本番: [vehicle-maintenance.y-kakeibo.workers.dev](https://vehicle-maintenance.y-kakeibo.workers.dev)

- [概要](#アプリの概要)
- [機能](#主な機能)
- [使用技術](#使用技術ツールライブラリ)
- [フォルダ構成](#フォルダ構成)
- [設計上の要点](#設計上の要点)
- [ファイル別解説](#ファイル別解説全72ファイル)
- [アーキテクチャ解説 →](architecture.md)

「Cloudflare と Supabase がどう通信しているか」「招待フローはどう動くか」といった **動作の流れ**は [アーキテクチャ解説](architecture.md) にまとめています。このページはアプリの全体像とファイル単位の索引です。

## アプリの概要

車・バイクを複数台登録し、車検満了日と整備記録（オイル交換・タイヤ交換など）を個人ごとに記録・閲覧できるモバイルファーストの Web アプリです。招待制（公開サインアップ無効）のメール＋パスワード認証で、利用者が自分のデータしか見られないことを Supabase の Row Level Security（RLS）で保証しています。車検の満了が近づくとアプリ内（ダッシュボード・車両詳細）で警告を表示しますが、メール／Push／LINE 通知や定期実行（Cron）は意図的に持たない、閲覧時に計算するだけのシンプルな設計です。

## 主な機能

- **認証** — メール＋パスワードログイン。公開サインアップは無効で、オーナーが `scripts/invite-user.ts` で招待し、招待された側が `/set-password` で初期パスワードを設定する
- **車両管理** — 車種名・車両区分（車／バイク）・車検満了日（任意。250cc 以下のバイク等は車検なしを想定）を登録・編集・削除
- **整備記録** — 日付・作業内容（プリセット7種＋自由入力）・走行距離・部品／型式・備考を車両ごとに記録。作業内容フィルタ、部品/型式の過去入力サジェスト、走行距離の逆行（前後の記録と矛盾する値）警告つき
- **車検アラート** — 満了までの残り日数を**暦月**単位で判定し、「残り2ヶ月→警告」「残り1ヶ月→危険」「超過→期限切れ」の3段階をダッシュボード・車両詳細に表示
- **車検更新の記録** — 受検日と有効期間（+2年／+3年）から次の満了日を**制度どおり** 自動計算（満了日の1ヶ月前以内に受検した場合は「旧満了日＋N年」に繰り越し）。計算結果は手動修正も可能で、記録の追加と満了日の更新を1つのDBトランザクション（`complete_shaken` RPC）で行う
- **ダッシュボード** — 登録車両ごとに現在の走行距離・前回整備日・車検アラートを一覧表示

## 使用技術・ツール・ライブラリ

| 領域 | 技術 | 役割 |
| --- | --- | --- |
| フレームワーク | `@tanstack/react-start` / `@tanstack/react-router` | フルスタック React。ファイルベースルーティング・サーバー関数（`createServerFn`） |
| UI | `react` 19 | 素の HTML フォーム中心。UI ライブラリは使わない方針 |
| 認証・DB | `@supabase/supabase-js` / `@supabase/ssr` | PostgreSQL・Auth・Row Level Security。`@supabase/ssr` でサーバー/ブラウザ両クライアントを構築 |
| 入力検証 | `zod` 4 | 全サーバー関数の入口でスキーマ検証（クライアント側の検証を信用しない方針） |
| 日付表示 | `date-fns` | 表示整形専用（`formatJa` 系）。日付の計算には一切使わない |
| ビルド | `vite` 8 / `typescript` 6 |  |
| デプロイ | `wrangler` / `@cloudflare/vite-plugin` | Cloudflare Workers。実行環境は常に `TZ=UTC` |
| 単体・結合テスト | `vitest` 5 / `@testing-library/react` / `jsdom` | `unit`（node）と `dom`（jsdom）の2プロジェクト構成 |
| E2E テスト | `@playwright/test` | `mobile`（Pixel 5）/ `desktop` の2プロジェクトで実ブラウザ検証 |
| DB マイグレーション | `supabase` CLI | マイグレーションファイルの管理のみに使用（`link`/`db push` は使わず、SQL Editor手動貼り付けで適用） |
| Lint / Format | `eslint`（`@tanstack/eslint-config`） / `prettier` | `src/**/lib/**` から React/TanStack/Supabase の import を禁止する独自ルールを追加 |

## フォルダ構成

| パス | 役割 |
| --- | --- |
| `src/routes/` | TanStack Router のファイルベースルート。URL とページ UI の対応。`_authed.tsx` が認証ガード付き共通レイアウト |
| `src/routeTree.gen.ts` | 自動生成（コミット対象）。`src/routes/` から `npm run build`/`dev` 時に再生成される |
| `src/features/<domain>/` | 機能単位のディレクトリ（`auth` / `vehicles` / `maintenance` / `shaken` / `dashboard`）。各配下に `lib/`（純粋関数）・`server/`（サーバー関数）・フォームコンポーネントを持つ |
| `src/features/*/lib/` | React・TanStack・Supabase を import しない純粋関数（Zod スキーマ・判定ロジック等）。単体テストの主対象 |
| `src/features/*/server/` | `createServerFn` で包んだサーバー関数。実処理は `deps` 注入可能な `xxxHandler` に分離し、Supabase クライアントをモックしてテストする |
| `src/lib/date/` | JST/UTC を扱う日付ユーティリティ（`DateString` ブランド型・`todayInJst`・月加算・表示整形） |
| `src/lib/url/` | オープンリダイレクト対策（`isSafeRedirectPath`） |
| `src/lib/supabase/` | 環境変数検証（`env.ts`）と自動生成の DB 型（`database.types.ts`） |
| `src/integrations/supabase/` | Supabase SDK を実際に配線する層（ブラウザ/サーバー クライアント生成）。`lib/` の import 禁止ルールと矛盾しないよう分離 |
| `src/test/` | Vitest のグローバルセットアップ（`@testing-library/jest-dom` 等） |
| `public/` | そのまま配信される静的ファイル。ホーム画面アイコン一式（`apple-touch-icon.png` / `icon-*.png` / `favicon.*`）と `manifest.webmanifest` |
| `image/` | アイコンの元絵（`icon.jpg`）。配信されないので、差し替えたら `tools/generate-icons.py` で `public/` を作り直す |
| `tools/` | 開発時の補助スクリプト（`generate-icons.py`：元絵から各サイズのアイコンを生成） |
| `scripts/` | 依頼者がローカルで実行する運用スクリプト（`invite-user.ts`）。Claude は実行しない |
| `supabase/migrations/` | DB マイグレーション SQL（5本）。テーブル定義・RLS ポリシー・`complete_shaken` 関数 |
| `supabase/tests/` | RLS を守る統合テスト（開発用 Supabase プロジェクトに対して実行。`npm run test:rls`） |
| `e2e/` | Playwright E2E テスト一式（`support/` ヘルパー＋`tests/` 8シナリオ） |
| `docs/` | 本ドキュメント。ソースファイル単位の解説ページと、このプロジェクト全体解説ページ |

## 設計上の要点

- **JST と UTC** — Cloudflare Workers の実行環境は常に `TZ=UTC` だが利用者は JST。カレンダー計算に生の `Date` を使わず、`todayInJst()` と branded 型 `DateString` で「JST の暦日」だけを扱う。表示整形（`date-fns`）は UTC ゲッターで実装し、環境依存を避けている
- **Supabase クライアントのメモ化禁止** — サーバー用クライアントをモジュールスコープでメモ化すると、 Workers の isolate 再利用で他人のセッションを掴む危険があるため、リクエストのたびに生成する
- **RLS の UPDATE ポリシー** — `USING` と `WITH CHECK` の両方を書き、所有権の書き換え（他人の `user_id` への付け替え）を防ぐ
- **境界のある純粋関数** — `src/**/lib/**` は ESLint ルールで React/TanStack/Supabase の import を禁止。テスト容易性とロジックの独立性を保証する
- **全書き込みはサーバー側で Zod 検証** — サーバー関数は実 HTTP エンドポイントのため、クライアント側の入力チェックを信用しない

## ファイル別解説（全72ファイル）

機能（feature）単位でグループ化した、各ソースファイルの個別解説ページへのリンク集です。

### ルート / ページ（src/routes）

- [\_\_root.tsx](src/routes/__root.md) — HTML の骨格・head・ホーム画面アイコン
- [\_authed.tsx](src/routes/_authed.md) — 共通レイアウト・認証ガード
- [\_authed.index.tsx](src/routes/_authed.index.md) — ダッシュボード（トップページ）
- [login.tsx](src/routes/login.md) — ログインページ
- [set-password.tsx](src/routes/set-password.md) — 招待後のパスワード設定
- [\_authed.vehicles.index.tsx](src/routes/_authed.vehicles.index.md) — 車両一覧
- [\_authed.vehicles.new.tsx](src/routes/_authed.vehicles.new.md) — 車両新規登録
- [\_authed.vehicles.$vehicleId.tsx](src/routes/_authed.vehicles.$vehicleId.md) — 車両詳細レイアウト
- [\_authed.vehicles.$vehicleId.index.tsx](src/routes/_authed.vehicles.$vehicleId.index.md) — 車両詳細・整備記録一覧
- [\_authed.vehicles.$vehicleId.edit.tsx](src/routes/_authed.vehicles.$vehicleId.edit.md) — 車両編集
- [\_authed.vehicles.$vehicleId.records.new.tsx](src/routes/_authed.vehicles.$vehicleId.records.new.md) — 整備記録の新規登録
- […records.$recordId.edit.tsx](src/routes/_authed.vehicles.$vehicleId.records.$recordId.edit.md) — 整備記録の編集

### デザインシステム（src/styles・src/components）

[design.md](design.md) を唯一の基準として組んだ、色・文字・余白・角丸のトークンと共通部品です。各ファイルに生の色コードは書かず、必ず `tokens.css` を参照します。

- [styles.css](src/styles.md) — 読み込みの入口
- [styles/tokens.css](src/styles/tokens.md) — 色・文字・余白・角丸の定義
- [styles/base.css](src/styles/base.md) — リセットと地の文
- [styles/layout.css](src/styles/layout.md) — ページの骨格・グリッド
- [styles/nav.css](src/styles/nav.md) — 上部2段ナビ
- [styles/buttons.css](src/styles/buttons.md) — ボタンの3文法
- [styles/forms.css](src/styles/forms.md) — 入力欄・エラー表示
- [styles/cards.css](src/styles/cards.md) — カード・一覧行・アラート
- [components/app-nav.tsx](src/components/app-nav.md) — 全ページ共通のナビ
- [components/page-header.tsx](src/components/page-header.md) — ページ名と主要アクション

### 機能: 認証（src/features/auth）

- [require-user.ts](src/features/auth/require-user.md) — 認証必須ルートのガード
- [lib/auth-errors.ts](src/features/auth/lib/auth-errors.md)
- [lib/login-schema.ts](src/features/auth/lib/login-schema.md)
- [server/login.ts](src/features/auth/server/login.md)
- [server/logout.ts](src/features/auth/server/logout.md)
- [server/get-session.ts](src/features/auth/server/get-session.md)

### 機能: 車両（src/features/vehicles）

- [vehicle-form.tsx](src/features/vehicles/vehicle-form.md)
- [lib/vehicle-schema.ts](src/features/vehicles/lib/vehicle-schema.md)
- [lib/vehicle-id-schema.ts](src/features/vehicles/lib/vehicle-id-schema.md)
- [lib/vehicle-type.ts](src/features/vehicles/lib/vehicle-type.md)
- [lib/shaken-required.ts](src/features/vehicles/lib/shaken-required.md)
- [server/create.ts](src/features/vehicles/server/create.md)
- [server/get.ts](src/features/vehicles/server/get.md)
- [server/list.ts](src/features/vehicles/server/list.md)
- [server/update.ts](src/features/vehicles/server/update.md)
- [server/delete.ts](src/features/vehicles/server/delete.md)

### 機能: 整備記録（src/features/maintenance）

- [record-form.tsx](src/features/maintenance/record-form.md)
- [lib/record-schema.ts](src/features/maintenance/lib/record-schema.md)
- [lib/record-id-schema.ts](src/features/maintenance/lib/record-id-schema.md)
- [lib/vehicle-scope-schema.ts](src/features/maintenance/lib/vehicle-scope-schema.md)
- [lib/work-types.ts](src/features/maintenance/lib/work-types.md)
- [lib/odometer.ts](src/features/maintenance/lib/odometer.md)
- [lib/part-suggestions.ts](src/features/maintenance/lib/part-suggestions.md)
- [lib/sort-records.ts](src/features/maintenance/lib/sort-records.md)
- [lib/filter-records.ts](src/features/maintenance/lib/filter-records.md)
- [server/create.ts](src/features/maintenance/server/create.md)
- [server/list.ts](src/features/maintenance/server/list.md)
- [server/list-all.ts](src/features/maintenance/server/list-all.md)
- [server/list-part-details.ts](src/features/maintenance/server/list-part-details.md)
- [server/update.ts](src/features/maintenance/server/update.md)
- [server/delete.ts](src/features/maintenance/server/delete.md)

### 機能: 車検（src/features/shaken）

- [lib/alert-tier.ts](src/features/shaken/lib/alert-tier.md)
- [lib/days-remaining.ts](src/features/shaken/lib/days-remaining.md)
- [lib/renewal.ts](src/features/shaken/lib/renewal.md)
- [lib/messages.ts](src/features/shaken/lib/messages.md)
- [lib/complete-shaken-schema.ts](src/features/shaken/lib/complete-shaken-schema.md)
- [server/complete-shaken.ts](src/features/shaken/server/complete-shaken.md)

### 機能: ダッシュボード（src/features/dashboard）

- [lib/build-summary.ts](src/features/dashboard/lib/build-summary.md)
- [lib/since-last-service.ts](src/features/dashboard/lib/since-last-service.md)

### 共通ライブラリ（src/lib）

React / TanStack / Supabase に依存しない純粋関数群。

- [date/jst.ts](src/lib/date/jst.md)
- [date/date-string.ts](src/lib/date/date-string.md)
- [date/date-string-schema.ts](src/lib/date/date-string-schema.md)
- [date/add-months.ts](src/lib/date/add-months.md)
- [date/format-ja.ts](src/lib/date/format-ja.md)
- [url/safe-redirect.ts](src/lib/url/safe-redirect.md) — オープンリダイレクト対策
- [supabase/env.ts](src/lib/supabase/env.md)

### 外部連携（src/integrations/supabase）

- [client.ts](src/integrations/supabase/client.md)
- [server.ts](src/integrations/supabase/server.md)

### スクリプト（scripts）

- [invite-user.ts](scripts/invite-user.md)

### Supabase / DB（supabase）

- [migrations/\*.sql](supabase/migrations.md) — マイグレーション5本
- [tests/rls](supabase/tests/rls.md) — RLS 統合テスト基盤

### E2E テスト

- [e2e/\*](e2e.md) — Playwright E2E テスト一式（8シナリオ）

関連: [setup-supabase.md](setup-supabase.md)（Supabase セットアップ手順・Markdown）

---

*このページはプロジェクト全体の解説（概要・機能・使用技術・フォルダ構成）と、docs/ 配下のファイル別解説ドキュメントへの目次を兼ねています。各ソースファイルが完成するたびに生成される個別ページとは別に、フェーズの区切りで手動で作成・更新します。*
