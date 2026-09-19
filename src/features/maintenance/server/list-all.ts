import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { MaintenanceRecordRow } from './list'

interface ListAllRecordsDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * ログイン中ユーザーの整備記録を、車両を問わず全件返す。
 *
 * `dashboard/lib/build-summary.ts` が車両横断で「最終整備日」「現在の走行距離」
 * を集計するために使う。1台の車両にスコープする `list.ts` とは違い、
 * こちらは `vehicleId` を受け取らない。絞り込みをこの関数側で書かないのは
 * `vehicles/server/list.ts` と同じ理由（`maintenance_records_select_own`
 * ポリシー(RLS)に委任）。
 */
export async function listAllRecordsHandler(deps: ListAllRecordsDeps): Promise<MaintenanceRecordRow[]> {
  const { data, error } = await deps.supabase.from('maintenance_records').select('*')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const listAllRecordsFn = createServerFn({ method: 'GET' }).handler(() =>
  listAllRecordsHandler({ supabase: createSupabaseServerClient() }),
)
