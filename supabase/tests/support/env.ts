const PRODUCTION_HOST = 'wwvuxjvcwntqzdvyezss.supabase.co'

function requireEnv(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `${name} が設定されていません。.env（VITE_接頭辞の値）と scripts/.env（SUPABASE_SECRET_KEY）を確認してください。`,
    )
  }
  return value
}

export const supabaseUrl = requireEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
export const publishableKey = requireEnv(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
export const secretKey = requireEnv('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY)

// RLS 統合テストはテストユーザーの作成・削除を伴うため、誤って本番プロジェクトに
// 対して実行されることを防ぐガード。
if (supabaseUrl.includes(PRODUCTION_HOST)) {
  throw new Error(
    'RLS統合テストが本番用Supabaseプロジェクトを指しています。.env のVITE_SUPABASE_URLが開発用プロジェクトのものであることを確認してください。',
  )
}
