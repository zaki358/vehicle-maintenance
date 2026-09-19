import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { vehicleIdSchema } from '../lib/vehicle-id-schema'
import type { VehicleIdInput } from '../lib/vehicle-id-schema'
import type { VehicleRow } from './list'

interface GetVehicleDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 車両を1件取得する。
 *
 * 存在しない ID と、他人の車両の ID（RLS がブロックする）を区別せず、
 * どちらも `null` として返す。区別してしまうと「この ID は他人が
 * 使っている」という情報が漏れる。
 */
export async function getVehicleHandler(input: VehicleIdInput, deps: GetVehicleDeps): Promise<VehicleRow | null> {
  const { data, error } = await deps.supabase.from('vehicles').select('*').eq('id', input.id).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const getVehicleFn = createServerFn({ method: 'GET' })
  .validator(vehicleIdSchema)
  .handler(({ data }) => getVehicleHandler(data, { supabase: createSupabaseServerClient() }))
