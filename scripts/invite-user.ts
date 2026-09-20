import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/database.types.ts'

/**
 * オーナーが自分の PC で実行する、利用者を招待するためのローカル専用スクリプト。
 *
 * 実行方法:
 *   node scripts/invite-user.ts <招待するメールアドレス> [招待後の遷移先URL]
 *
 * 例:
 *   node scripts/invite-user.ts friend@example.com https://vehicle-maintenance.example.workers.dev/set-password
 *
 * 事前準備: `scripts/.env` に `SUPABASE_SECRET_KEY`（招待先プロジェクトの secret key）を
 * 設定しておくこと。このキーは Supabase ダッシュボードの Project Settings → API から
 * 取得できる、公開してはいけない値。`scripts/.env` は .gitignore 対象。
 *
 * `VITE_SUPABASE_URL` は既存の `.env`（開発用）または `.env.production.local`（本番用）を
 * そのまま使う。開発用プロジェクトへの招待でテストしたいときは `.env` の値のまま、
 * 実際の利用者を本番プロジェクトへ招待したいときは `scripts/.env` に
 * `VITE_SUPABASE_URL=<本番プロジェクトの API URL>` を追記して上書きする。
 *
 * `supabase.auth.admin.inviteUserByEmail()` は PKCE 非対応（招待する側と
 * リンクを踏む側でブラウザが異なるため）。招待メールのリンクは実装時の調査どおり
 * `#access_token=...&type=invite` 形式になる。`@supabase/ssr` のブラウザ用
 * クライアントは flowType が pkce 固定でこの形式を自動検出しないため、
 * `routes/set-password.tsx` が `parseAuthHash` で自前に解析し、
 * `setSession()` でセッションを確立する。
 */

const PRODUCTION_HOST = 'wwvuxjvcwntqzdvyezss.supabase.co'
const DEFAULT_REDIRECT_TO = 'http://localhost:3000/set-password'

function loadEnvFiles(): void {
  for (const relativePath of ['.env', 'scripts/.env']) {
    const path = resolve(process.cwd(), relativePath)
    if (existsSync(path)) {
      process.loadEnvFile(path)
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} が設定されていません。.env と scripts/.env を確認してください。`)
  }
  return value
}

async function main(): Promise<void> {
  const email = process.argv[2]
  if (!email) {
    console.error('使い方: node scripts/invite-user.ts <招待するメールアドレス> [招待後の遷移先URL]')
    process.exitCode = 1
    return
  }

  loadEnvFiles()

  const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
  const secretKey = requireEnv('SUPABASE_SECRET_KEY')
  const redirectTo = process.argv[3] ?? DEFAULT_REDIRECT_TO

  const projectLabel = supabaseUrl.includes(PRODUCTION_HOST) ? '本番' : '開発用'
  console.log(`招待先プロジェクト: ${projectLabel}（${supabaseUrl}）`)
  console.log(`招待後の遷移先: ${redirectTo}`)
  console.log(
    'この URL が Supabase ダッシュボードの Authentication → URL Configuration → Redirect URLs に' +
      ' 登録されていないと、招待メールのリンクがこの URL へ遷移しません。',
  )

  const admin = createClient<Database>(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (error) {
    console.error(`招待に失敗しました: ${error.message}`)
    process.exitCode = 1
    return
  }

  console.log(`招待メールを送信しました: ${data.user.email}`)
}

await main()
