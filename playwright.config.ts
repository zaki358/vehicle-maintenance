import { defineConfig, devices } from '@playwright/test'

const PORT = 3101
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E（Playwright）専用の設定。`vitest.config.ts`（unit/dom）・`vitest.rls.config.ts`
 * （RLS統合テスト）とは完全に独立しており、`npm run test` / `npm run test:coverage` の
 * 対象には含めない。`npm run test:e2e` で明示的に実行する。
 *
 * 開発サーバーは `webServer` で自動起動する。ポート3000は別セッションの
 * `npm run dev` が使用中の可能性があるため、`.claude/launch.json` の
 * `vehicle-maintenance-dev-alt` と同じ考え方でポート3101を使う
 * （`package.json` の `dev` スクリプト自体は招待メールのリダイレクトURL設定と
 * 結びついているため変更しない。詳細は `.claude/agent-memory/progress.md` を参照）。
 *
 * 実際の開発用Supabaseプロジェクト（本番ではない）に対して実行する。
 * テストユーザー・車両・整備記録は各テストファイルが使い捨てで作成・削除する
 * （`e2e/support/*` 参照）。
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  // 開発用SupabaseプロジェクトのAuthレート制限(ユーザー作成・サインイン)に
  // 短時間で達しないよう、ワーカー数を絞る(実際に "Request rate limit reached" を
  // 確認したうえで調整した)。`e2e/support/supabase-admin.ts` 側にも
  // レート制限エラー向けの簡易リトライを実装している。
  workers: 2,
  forbidOnly: !!process.env.CI,
  // ローカルの単一devサーバー・単一Supabase開発プロジェクトに対して並行実行するため、
  // ログイン直後のセッション反映やSupabase Authのレート制限まわりで低確率の
  // タイミング起因の再試行可能な失敗が起こりうる（実際に確認済み）。2回まで再試行する。
  retries: process.env.CI ? 1 : 2,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: `npx vite dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
