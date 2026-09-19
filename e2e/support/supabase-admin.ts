import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { publishableKey, secretKey, supabaseUrl } from './env'

const NO_SESSION_PERSISTENCE = { auth: { autoRefreshToken: false, persistSession: false } }

/**
 * service_role 相当のクライアント。**Auth Admin API（ユーザーの作成/削除）専用。**
 *
 * `vehicles`/`maintenance_records` の grant はマイグレーションで `authenticated`
 * ロールにしか与えていない（`supabase/migrations/*_create_vehicles.sql` 等参照）ため、
 * このクライアントで直接 `.from('vehicles').insert(...)` すると
 * "permission denied for table vehicles" になる（実際に実行して確認済み）。
 * テーブルへの読み書きは `provisionAuthenticatedUser` が返す、ログイン済みの
 * クライアント（`authenticated` ロール・RLS適用）を使うこと
 * （`supabase/tests/support/test-clients.ts` の `provisionTestUser` と同じ方式）。
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, secretKey, NO_SESSION_PERSISTENCE)
}

/** 未ログイン(anon)を模したクライアント。テストユーザーのサインインにも使う。 */
export function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, publishableKey, NO_SESSION_PERSISTENCE)
}

export interface E2eTestUser {
  id: string
  email: string
  password: string
  /** サインイン済みクライアント。`vehicles`/`maintenance_records` のシード・検証に使う（RLS適用）。 */
  client: SupabaseClient<Database>
}

const MAX_ATTEMPTS = 4
const BASE_BACKOFF_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(error: { code?: string; message: string }): boolean {
  return error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit' ||
    error.message.toLowerCase().includes('rate limit')
}

/**
 * Supabase Auth のレート制限（複数のテストファイルが並行してユーザー作成・
 * サインインを行うため、開発用プロジェクトのAuthレート制限に短時間で達することがある。
 * 実際に "Request rate limit reached" を確認済み）に対する簡易リトライ。
 * `operation` の戻り値の形（`{ data, error }` の判別可能ユニオン）をそのまま
 * 返すことで、呼び出し側の型の絞り込み（`if (error) throw; else data.xxx`）を壊さない。
 */
async function withRateLimitRetry<T extends { error: { code?: string; message: string } | null }>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await operation()
    const isLastAttempt = attempt === MAX_ATTEMPTS - 1
    if (!result.error || !isRateLimitError(result.error) || isLastAttempt) {
      return result
    }
    await sleep(BASE_BACKOFF_MS * 2 ** attempt)
  }
  // MAX_ATTEMPTS >= 1 のためここには到達しないが、TypeScriptの制御フロー解析のために必要。
  throw new Error('unreachable')
}

/**
 * 公開サインアップが無効なため、Admin API でE2E用の使い捨てユーザーを作成したうえで、
 * publishable key のクライアントでサインインし、RLSが適用される「本物のログイン状態の
 * クライアント」を返す（`supabase/tests/support/test-clients.ts` の `provisionTestUser`
 * と同じ方式）。実際のUIログイン検証（`login.spec.ts`）とは別に、他のテストがデータの
 * シード/検証を高速に行うために使う。
 */
export async function createTestUser(admin: SupabaseClient<Database>, label: string): Promise<E2eTestUser> {
  const email = `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = `E2e-${crypto.randomUUID()}`

  const { data, error } = await withRateLimitRetry(() =>
    admin.auth.admin.createUser({ email, password, email_confirm: true }),
  )
  if (error) {
    throw new Error(`E2Eテストユーザー(${label})の作成に失敗しました: ${error.message}`)
  }

  const client = createAnonClient()
  const { error: signInError } = await withRateLimitRetry(() => client.auth.signInWithPassword({ email, password }))
  if (signInError) {
    // ここで例外を投げる前に、直前で作成済みの使い捨てユーザーを必ず削除する。
    // でないと「作成は成功したがサインインだけ失敗した」ケースで、削除されない
    // ユーザーが開発用Supabaseプロジェクトに残り続けてしまう
    // （実際にこの経路で12件のゴミユーザーが残留したことを確認し、この対策を追加した）。
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {
      // ロールバック自体の失敗はもみ消さない方が良いが、元のサインインエラーを
      // 隠さないことを優先する。ロールバックに失敗した場合は手動確認が必要。
    })
    throw new Error(`E2Eテストユーザー(${label})のサインインに失敗しました: ${signInError.message}`)
  }

  return { id: data.user.id, email, password, client }
}

/** ユーザーを削除する。`vehicles.user_id` の cascade により所有データ（車両・整備記録）も一緒に消える。 */
export async function deleteTestUser(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(`E2Eテストユーザー(${userId})の削除に失敗しました: ${error.message}`)
  }
}
