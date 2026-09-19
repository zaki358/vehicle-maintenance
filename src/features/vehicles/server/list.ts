import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database, Tables } from '@/lib/supabase/database.types'

export type VehicleRow = Tables<'vehicles'>

interface ListVehiclesDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * ログイン中ユーザーの車両一覧を返す。
 *
 * `user_id` での絞り込みをこの関数側で書かないのは意図的。`vehicles_select_own`
 * ポリシー（RLS）が既に `auth.uid() = user_id` を強制しており、二重に書くと
 * 「ポリシーが正しく機能しているか」をアプリコードのフィルタが隠してしまう。
 */
export async function listVehiclesHandler(deps: ListVehiclesDeps): Promise<VehicleRow[]> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const listVehiclesFn = createServerFn({ method: 'GET' }).handler(() =>
  listVehiclesHandler({ supabase: createSupabaseServerClient() }),
)
