//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // lib/ の純粋性を守る境界ルール
  //
  // `src/**/lib/**` に置くのは「純粋関数」だけ、という約束を機械的に強制する。
  // React・TanStack・Supabase を import できてしまうと、この層は
  // DB もブラウザも無しにテストできなくなり、カバレッジ 80% の達成が
  // 一気に高コストになる。この境界は放っておくと 1 ヶ月で崩れる。
  //
  // 日付計算や車検の期限判定をこの層に置いているのは、
  // まさにここが「DB 無しで徹底的にテストしたい」場所だから。
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message:
                'lib/ は純粋関数の層です。React に依存させないでください。UI が必要なら components/ か features/*/ 直下へ。',
            },
            {
              group: ['@tanstack/*'],
              message:
                'lib/ は純粋関数の層です。ルーターやサーバー関数に依存させないでください。ルーティング絡みは routes/ か features/*/server/ へ。',
            },
            {
              group: ['@supabase/*'],
              message:
                'lib/ は純粋関数の層です。DB アクセスを持ち込まないでください。Supabase を触るコードは features/*/server/ へ。',
            },
          ],
        },
      ],
    },
  },

  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'dist/**',
      'coverage/**',
      '.wrangler/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]
