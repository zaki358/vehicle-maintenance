import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { vehicleSchema } from '../lib/vehicle-schema'
import type { VehicleInput } from '../lib/vehicle-schema'
import type { VehicleRow } from './list'

interface CreateVehicleDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 車両を新規作成する。`user_id` を渡さないのは意図的：
 * `vehicles.user_id` の既定値 `auth.uid()` に任せることで、
 * クライアントが他人の `user_id` を詐称する余地そのものを無くす。
 */
export async function createVehicleHandler(input: VehicleInput, deps: CreateVehicleDeps): Promise<VehicleRow> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .insert({
      name: input.name,
      model_code: input.modelCode,
      vehicle_type: input.vehicleType,
      shaken_expiry_date: input.shakenExpiryDate,
      note: input.note,
    })
    .select()
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const createVehicleFn = createServerFn({ method: 'POST' })
  .validator(vehicleSchema)
  .handler(({ data }) => createVehicleHandler(data, { supabase: createSupabaseServerClient() }))
