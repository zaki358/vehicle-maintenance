import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { vehicleScopeSchema } from '../lib/vehicle-scope-schema'
import type { VehicleScopeInput } from '../lib/vehicle-scope-schema'

export type PartDetailRow = Pick<Tables<'maintenance_records'>, 'part_detail'>

interface ListPartDetailsDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 部品/型式のサジェスト用に、指定した車両の `part_detail` 列だけを
 * 実施日の新しい順で返す。整備記録の全列を持ってくる `list.ts` とは別に
 * 用意しているのは、サジェストには不要な列（備考等）まで転送しないため。
 * 重複除去や絞り込みは呼び出し側で `maintenance/lib/part-suggestions.ts` を使う。
 */
export async function listPartDetailsHandler(
  input: VehicleScopeInput,
  deps: ListPartDetailsDeps,
): Promise<PartDetailRow[]> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .select('part_detail')
    .eq('vehicle_id', input.vehicleId)
    .order('performed_on', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const listPartDetailsFn = createServerFn({ method: 'GET' })
  .validator(vehicleScopeSchema)
  .handler(({ data }) => listPartDetailsHandler(data, { supabase: createSupabaseServerClient() }))
