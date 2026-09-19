import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url({ error: 'VITE_SUPABASE_URL は URL 形式で設定してください' }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY を設定してください'),
})

export interface SupabaseEnv {
  url: string
  publishableKey: string
}

/**
 * Supabase 接続に必要な環境変数を読み取り、検証する。
 *
 * `import.meta.env.VITE_*` は Vite がビルド時に静的な文字列へ置き換えるため、
 * `process.env` と違って Cloudflare Workers のリクエストごと注入を待つ必要はない。
 * それでもモジュールスコープの定数にせず関数内で読むのは、テストから
 * 異なる環境変数の組み合わせを毎回シミュレートできるようにするため。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const parsed = envSchema.safeParse(import.meta.env)
  if (!parsed.success) {
    throw new Error(
      `Supabase の環境変数が正しく設定されていません。.env を確認してください: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`,
    )
  }
  return {
    url: parsed.data.VITE_SUPABASE_URL,
    publishableKey: parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
}
