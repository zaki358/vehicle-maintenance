import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { publishableKey, secretKey, supabaseUrl } from './env'

const NO_SESSION_PERSISTENCE = { auth: { autoRefreshToken: false, persistSession: false } }

/** service_role 相当。テストユーザーの作成・削除にのみ使う。RLSポリシーの検証には使わない。 */
export function createAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, secretKey, NO_SESSION_PERSISTENCE)
}

/** 未ログイン(anon)を模したクライアント。 */
export function createAnonClient(): SupabaseClient {
  return createClient(supabaseUrl, publishableKey, NO_SESSION_PERSISTENCE)
}

export interface TestUser {
  id: string
  client: SupabaseClient
}

/**
 * 公開サインアップが無効なため、Admin API でユーザーを作成してから
 * publishable key のクライアントでサインインし、RLS が適用される
 * 「本物のログイン状態のクライアント」を得る。
 */
export async function provisionTestUser(admin: SupabaseClient, label: string): Promise<TestUser> {
  const email = `rls-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = crypto.randomUUID()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`テストユーザー(${label})の作成に失敗しました: ${error.message}`)
  }

  const client = createAnonClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })

  if (signInError) {
    throw new Error(`テストユーザー(${label})のサインインに失敗しました: ${signInError.message}`)
  }

  return { id: data.user.id, client }
}

/** ユーザーを削除する。`vehicles.user_id` の cascade により所有データも一緒に消える。 */
export async function deleteTestUser(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(`テストユーザー(${userId})の削除に失敗しました: ${error.message}`)
  }
}
