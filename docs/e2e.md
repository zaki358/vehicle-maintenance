# E2E（Playwright）テスト基盤 — Phase 8: 検証とデプロイ

*playwright.config.ts ／ e2e/\*\**

## 概要

実装プランで指定された「Playwright MCP、`mobile`（iPhone 13 / Pixel 5）と `desktop`（1280×800）の2プロジェクト」を実現する、ブラウザ越しのエンドツーエンドテスト一式。単体テスト（Vitest）やRLS統合テストとは異なり、 **実際に動いている開発サーバーを、実際のブラウザで、実際の開発用Supabase プロジェクトに対して**操作する、最も本番に近いレイヤーの検証。

優先順位付きの8シナリオ（ログイン・ルートガード・車検アラート・車検完了・データ分離・250ccバイク・整備記録・モバイル人間工学）をすべて実装し、 `mobile`/`desktop` 両プロジェクトで実行して全件成功させた。

`npm run test:coverage`（Vitest）とは完全に独立しており、 `npm run test:e2e`（`playwright test`）で明示的に実行する。

## 構成

| ファイル | 役割 |
| --- | --- |
| `playwright.config.ts` | 2プロジェクト（mobile/desktop）・開発サーバー自動起動・リトライ等の設定 |
| `e2e/support/env.ts` | 環境変数の検証と、本番プロジェクト誤爆防止ガード（RLSテストと同じ考え方） |
| `e2e/support/supabase-admin.ts` | 使い捨てE2Eユーザーの作成・削除（レート制限リトライ・ロールバック付き） |
| `e2e/support/seed.ts` | 車両・整備記録を直接insertする前提データ投入ヘルパー |
| `e2e/support/auth.ts` | 実際のログインフォームを操作する共通関数 |
| `e2e/support/navigation.ts` | ハイドレーション完了を待ってから遷移する`gotoReady` |
| `e2e/tests/*.spec.ts`（8ファイル） | シナリオ1〜8それぞれのテスト |

## コード解説

### 1. playwright.config.ts — 2プロジェクトと開発サーバーの自動起動

```ts
const PORT = 3101
...
projects: [
  { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  { name: 'mobile', use: { ...devices['Pixel 5'] } },
],
webServer: {
  command: `npx vite dev --port ${PORT}`,
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
```

ポート3000は別セッションの`npm run dev`が使用中の可能性があるため、 Phase 7でポート競合対策として追加した`.claude/launch.json`の `vehicle-maintenance-dev-alt`と同じ考え方でポート3101を使う。 `package.json`の`dev`スクリプト自体は招待メールのリダイレクトURL設定と結びついているため変更していない。

`webServer`によりPlaywrightがテスト実行前に自動でdevサーバーを起動し、テスト終了後に自動で止める。手動で別ターミナルを開いておく必要がない。

```ts
workers: 2,
retries: process.env.CI ? 1 : 2,
```

**実際に動かして初めて分かった調整。**ワーカー数を上げすぎると単一の開発用SupabaseプロジェクトのAuthレート制限（ユーザー作成・サインイン）に短時間で達し、"Request rate limit reached" が実際に発生した。ワーカー数を2に絞り、さらに`supabase-admin.ts`側にもリトライを実装することで安定させている。

`retries: 2`も同様に、単一devサーバー・単一Supabaseプロジェクトへの並行アクセスに起因する低確率のタイミング依存の失敗（実際に確認済み）を吸収するための調整。

### 2. env.ts — 本番プロジェクト誤爆防止ガード

```ts
const PRODUCTION_HOST = 'wwvuxjvcwntqzdvyezss.supabase.co'
...
if (supabaseUrl.includes(PRODUCTION_HOST)) {
  throw new Error('E2Eテストが本番用Supabaseプロジェクトを指しています。...')
}
```

`supabase/tests/support/env.ts`（RLS統合テスト）とまったく同じ安全装置。E2Eテストもユーザー・車両・整備記録の作成/削除を伴うため、誤って本番プロジェクトに向けて実行されることを防ぐ。

### 3. supabase-admin.ts — 使い捨てユーザーとロールバック

```ts
export async function createTestUser(admin, label) {
  const { data, error } = await withRateLimitRetry(() =>
    admin.auth.admin.createUser({ email, password, email_confirm: true }),
  )
  ...
  const { error: signInError } = await withRateLimitRetry(() =>
    client.auth.signInWithPassword({ email, password }),
  )
  if (signInError) {
    // 作成済みユーザーを削除してから例外を投げる（ロールバック）
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {})
    throw new Error(...)
  }
  return { id: data.user.id, email, password, client }
}
```

**この実装に至る過程で、実際に12件のゴミユーザーが開発用 Supabaseプロジェクトに残留する事故が起きた。**初期実装ではユーザー作成が成功した後にサインインが失敗すると（レート制限の一時的なエラー等）、作成済みユーザーが削除されずに残り続けていた。原因を特定し、サインイン失敗時に作成済みユーザーを即座に削除するロールバック処理を追加したうえで、残留していた12件を手動で削除して解消した。「使い捨てリソースは失敗時も必ず後始末する」というこのプロジェクト全体の運用方針を、コードでも保証する形にしている。

`withRateLimitRetry`は指数バックオフ（1秒→2秒→4秒→8秒）で最大4回まで再試行する。レート制限以外のエラーや最終試行では即座に結果を返し、無限にリトライしない。

### 4. navigation.ts — ハイドレーション待ちで解決した"謎の失敗"

```ts
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' })
}
```

**調査に時間を要したバグの原因と対策。** `page.goto()`直後にフォーム操作を行うと、TanStack Startの開発サーバー（未バンドルのESMを1ファイルずつ読み込む）では Reactのハイドレーションが完了する前にクリックが届くことがあった。その場合`onSubmit`ハンドラが未アタッチのままブラウザの素のフォーム送信が発生し、ログイン処理が実行されずに同じ画面へ戻ってしまう。`waitUntil: 'networkidle'`を挟むことで、モジュール読み込みが落ち着いてから操作を始めるようにして解決した。一時は「TanStack Startのフレームワーク側の問題では」と疑われたが、後述の`getByLabel`の問題とあわせて、最終的にテスト側のタイミング制御の問題だったと判明した。

### 5. 8つのシナリオ（e2e/tests/\*.spec.ts）

| ファイル | シナリオ | 要点 |
| --- | --- | --- |
| `login.spec.ts` | 1. ログイン | 誤パスワードで日本語エラー、正しければダッシュボードへ |
| `route-guard.spec.ts` | 2. ルートガード | 未ログインで`/vehicles`→`/login`→ログイン後`/vehicles`に戻る |
| `shaken-alert.spec.ts` | 3. 車検アラート | `page.clock`で「今日」を固定し、55日後(警告)/20日後(危険)を検証 |
| `shaken-renewal.spec.ts` | 4. 車検完了 | +2年/+3年それぞれで満了日が正しく進み、記録が1件増える |
| `data-isolation.spec.ts` | 5. データ分離 | 2ユーザー分の`storageState`で、他人の車両URLが404になることを確認 |
| `motorcycle-no-shaken.spec.ts` | 6. 250ccバイク | 満了日なしの車両は詳細・ダッシュボードどちらにも車検UIが一切出ない |
| `maintenance-record.spec.ts` | 7. 整備記録 | 部品サジェスト（datalist）と作業内容フィルタの動作確認 |
| `mobile-ergonomics.spec.ts` | 8. モバイル人間工学 | 375px幅で記録追加まで2タップ以内・横スクロールが出ないこと（`mobile`専用、`desktop`では`test.skip`） |

いずれも公開サインアップが無効なため、`createTestUser`で使い捨てユーザーを作成し、シナリオに応じて`seedVehicle`/ `seedRecord`で前提データを投入してからブラウザ操作を行い、テスト終了後に`deleteTestUser`で必ず後始末する構成で統一している。

**調査の過程で「TanStack Startのフレームワーク側の不具合では」と一時疑われたが、最終的には2つのテスト側の問題（上記のハイドレーション待ちと、`getByLabel(label, {'{'} exact: true {'}'})`が `<select>`要素では`<option>`のテキストまで含めてラベルを計算してしまい厳密一致しなかった問題）に起因すると判明し、アプリ本体のコードに修正は不要だった。**

---

*生成日: 2026-09-19 ／ 対象ファイル: playwright.config.ts, e2e/support/\*.ts, e2e/tests/\*.spec.ts*
