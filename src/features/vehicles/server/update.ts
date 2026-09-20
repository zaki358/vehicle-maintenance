import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { vehicleIdSchema } from '../lib/vehicle-id-schema'
import { vehicleSchema } from '../lib/vehicle-schema'
import type { VehicleRow } from './list'

const updateVehicleSchema = vehicleIdSchema.extend(vehicleSchema.shape)

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>

interface UpdateVehicleDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 車両を更新する。存在しない・他人の車両（RLSがブロック）は区別せず `null` を返す。
 * `get.ts` と同じ理由：どちらも「他人の ID が存在する」という情報を漏らさないため。
 */
export async function updateVehicleHandler(
  input: UpdateVehicleInput,
  deps: UpdateVehicleDeps,
): Promise<VehicleRow | null> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .update({
      name: input.name,
      model_code: input.modelCode,
      vehicle_type: input.vehicleType,
      shaken_expiry_date: input.shakenExpiryDate,
      note: input.note,
    })
    .eq('id', input.id)
    .select()
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const updateVehicleFn = createServerFn({ method: 'POST' })
  .validator(updateVehicleSchema)
  .handler(({ data }) => updateVehicleHandler(data, { supabase: createSupabaseServerClient() }))
