import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { vehicleScopeSchema } from '../lib/vehicle-scope-schema'
import type { VehicleScopeInput } from '../lib/vehicle-scope-schema'

export type MaintenanceRecordRow = Tables<'maintenance_records'>

interface ListRecordsDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 指定した車両の整備記録一覧を実施日の新しい順で返す。
 *
 * `user_id` での絞り込みをこの関数側で書かないのは vehicles/server/list.ts と同じ理由
 * （`maintenance_records_select_own` ポリシーに委任）。複合外部キー
 * `(vehicle_id, user_id)` により `vehicle_id` は必ず自分の車両を指すため、
 * `vehicleId` だけの絞り込みで他人の記録が混ざる余地はない。
 */
export async function listRecordsHandler(
  input: VehicleScopeInput,
  deps: ListRecordsDeps,
): Promise<MaintenanceRecordRow[]> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', input.vehicleId)
    .order('performed_on', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const listRecordsFn = createServerFn({ method: 'GET' })
  .validator(vehicleScopeSchema)
  .handler(({ data }) => listRecordsHandler(data, { supabase: createSupabaseServerClient() }))
