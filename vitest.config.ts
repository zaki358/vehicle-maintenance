import { defineConfig } from 'vitest/config'

/**
 * テスト専用の Vite 設定。
 *
 * `vite.config.ts` とは意図的に別ファイルにしている。本番用の設定には
 * Cloudflare Workers プラグイン（`@cloudflare/vite-plugin`）が含まれており、
 * これを読み込むとテストが workerd ランタイム上で動こうとして、
 * jsdom も Node の API も使えなくなるため。
 *
 * Vitest は `vitest.config.ts` があればそちらを優先し、
 * `vite.config.ts` は読み込まない。
 */
export default defineConfig({
  // tsconfig の paths（`@/*` → `./src/*`）を解決する。
  // Vite 8 に内蔵されたため vite-tsconfig-paths パッケージは不要。
  resolve: { tsconfigPaths: true },

  test: {
    projects: [
      {
        // 純粋ロジック。DOM もネットワークも DB も使わない層。
        // カバレッジの大半をここで稼ぐ。
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // コンポーネントの「挙動」を検証する層。
        // マークアップの一致ではなく、ユーザー操作に対する反応を見る。
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.tsx'],
        },
      },
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // 自動生成
        'src/routeTree.gen.ts',
        'src/lib/supabase/database.types.ts',
        // テスト自身とテスト基盤
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        // ルーティングの繋ぎ込み。単体テストではなく E2E で検証する層
        'src/routes/**',
        'src/router.tsx',
      ],
      thresholds: {
        // プロジェクト全体の下限
        lines: 80,
        functions: 80,
        statements: 80,
        // branches が低めなのは、オプショナルチェーンやデフォルト引数の分岐まで
        // カウントされるため。意味のあるテスト対象ではない。
        branches: 75,

        // ドメインの中核は 100% を課す。
        // 車検の期限判定と日付計算は、間違えると「車検切れに気づけない」という
        // このアプリの存在意義そのものを壊すため。
        'src/lib/date/**': {
          lines: 100,
          functions: 100,
          statements: 100,
          branches: 95,
        },
        'src/features/shaken/lib/**': {
          lines: 100,
          functions: 100,
          statements: 100,
          branches: 95,
        },
      },
    },
  },
})
