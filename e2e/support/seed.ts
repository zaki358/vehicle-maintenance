import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables } from '@/lib/supabase/database.types'

/**
 * E2Eテスト用のデータ投入ヘルパー。
 *
 * `createTestUser` が返す **サインイン済み(authenticated)クライアント**で直接
 * insert する — UIで毎回車両登録フォームを埋めるよりも速く、かつ「アプリの
 * フォームが正しく動くか」の検証（vehicle-form.tsx 等）とは別の関心事
 * （前提データの用意）として分離するため。
 *
 * service_role（`createAdminClient()`）ではなくこちらを使うのが要点:
 * `vehicles`/`maintenance_records` への grant はマイグレーションで
 * `authenticated` ロールにしか与えていないため、service_role クライアントで
 * 直接 insert すると "permission denied" になる（実際に確認済み）。
 * `user_id` を明示的に渡さないのも意図的で、列の既定値 `auth.uid()` と
 * RLSの `with check` に任せることで、シードデータもアプリ本体のコードと
 * 同じ経路（RLS）を通す。
 */

export interface SeedVehicleInput {
  name: string
  vehicleType: 'car' | 'motorcycle'
  shakenExpiryDate?: string | null
  note?: string
}

export async function seedVehicle(
  client: SupabaseClient<Database>,
  input: SeedVehicleInput,
): Promise<Tables<'vehicles'>> {
  const { data, error } = await client
    .from('vehicles')
    .insert({
      name: input.name,
      vehicle_type: input.vehicleType,
      shaken_expiry_date: input.shakenExpiryDate ?? null,
      note: input.note ?? '',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`E2E車両シードに失敗しました: ${error.message}`)
  }
  return data
}

export interface SeedRecordInput {
  vehicleId: string
  performedOn: string
  workType: string
  workTypeOther?: string
  odometerKm?: number | null
  partDetail?: string
  note?: string
}

export async function seedRecord(
  client: SupabaseClient<Database>,
  input: SeedRecordInput,
): Promise<Tables<'maintenance_records'>> {
  const { data, error } = await client
    .from('maintenance_records')
    .insert({
      vehicle_id: input.vehicleId,
      performed_on: input.performedOn,
      work_type: input.workType,
      work_type_other: input.workTypeOther ?? '',
      odometer_km: input.odometerKm ?? null,
      part_detail: input.partDetail ?? '',
      note: input.note ?? '',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`E2E整備記録シードに失敗しました: ${error.message}`)
  }
  return data
}
