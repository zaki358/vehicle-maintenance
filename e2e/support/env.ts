import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const PRODUCTION_HOST = 'wwvuxjvcwntqzdvyezss.supabase.co'

/**
 * E2Eテストは Playwright のテストプロセス（Node）から直接 Supabase Admin API を
 * 叩くため、Vite の `import.meta.env` ではなく `process.env` に環境変数を
 * 読み込む必要がある。`supabase/tests/support/load-secret-env.ts` と同じ
 * `process.loadEnvFile` を使い、`.env`（VITE_接頭辞の値）と
 * `scripts/.env`（SUPABASE_SECRET_KEY）の両方を読み込む。
 */
function loadEnvFileIfExists(relativePath: string): void {
  const fullPath = resolve(process.cwd(), relativePath)
  if (existsSync(fullPath)) {
    process.loadEnvFile(fullPath)
  }
}

loadEnvFileIfExists('.env')
loadEnvFileIfExists('scripts/.env')

function requireEnv(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `${name} が設定されていません。.env（VITE_接頭辞の値）と scripts/.env（SUPABASE_SECRET_KEY）を確認してください。`,
    )
  }
  return value
}

export const supabaseUrl = requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL)
export const publishableKey = requireEnv(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
export const secretKey = requireEnv('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY)

// E2Eテストはテストユーザー・車両・整備記録の作成/削除を伴うため、
// 誤って本番用Supabaseプロジェクトに対して実行されることを防ぐガード
// （supabase/tests/support/env.ts と同じ考え方）。
if (supabaseUrl.includes(PRODUCTION_HOST)) {
  throw new Error(
    'E2Eテストが本番用Supabaseプロジェクトを指しています。.env のVITE_SUPABASE_URLが開発用プロジェクトのものであることを確認してください。',
  )
}
