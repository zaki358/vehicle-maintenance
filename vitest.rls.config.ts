import { defineConfig } from 'vitest/config'

/**
 * RLS 統合テスト専用の設定。`vitest.config.ts` の unit/dom プロジェクトとは
 * 意図的に分離している。開発用 Supabase プロジェクトへ実際にネットワーク接続し、
 * secret key でテストユーザーを作成・削除するため、`npm test` の対象には含めない
 * (デフォルトのテスト実行がネットワーク・秘密鍵に依存しない状態を保つため)。
 *
 * 実行: npm run test:rls
 * 必要な環境変数: .env の VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY(開発用)、
 *                scripts/.env の SUPABASE_SECRET_KEY(開発用)
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    name: 'rls',
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    setupFiles: ['./supabase/tests/support/load-secret-env.ts'],
    // 実ネットワーク越しにユーザー作成・サインインを行うため、通常より長めにする。
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
