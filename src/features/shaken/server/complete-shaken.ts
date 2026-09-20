import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { vehicleScopeSchema } from '@/features/maintenance/lib/vehicle-scope-schema'
import { completeShakenSchema } from '../lib/complete-shaken-schema'

/**
 * `completeShakenSchema` は `.refine()` を使っておらず `.shape` を持つが、
 * `record-schema.ts` と同じくネストしたフィールドとして合成する
 * （`maintenance/server/create.ts` と統一した形にするため）。
 */
const completeShakenRequestSchema = vehicleScopeSchema.extend({ shaken: completeShakenSchema })

export type CompleteShakenRequestInput = z.infer<typeof completeShakenRequestSchema>

export type CompletedShakenRecord = Tables<'maintenance_records'>

interface CompleteShakenDeps {
  supabase: Pick<SupabaseClient<Database>, 'rpc'>
}

/**
 * 車検完了を記録する。`complete_shaken` RPC（`security invoker` の Postgres 関数）
 * を呼び、「整備記録(work_type='shaken')の挿入」と「車両の満了日更新」を
 * 1トランザクションで実行する。PostgREST の単発リクエストはテーブルを跨げないため、
 * `.from().insert()` を2回に分けると「記録だけ増えて満了日が更新されない」
 * 半端な状態が起こりうる — それを防ぐのがこの関数の存在理由。
 */
export async function completeShakenHandler(
  input: CompleteShakenRequestInput,
  deps: CompleteShakenDeps,
): Promise<CompletedShakenRecord> {
  const { data, error } = await deps.supabase.rpc('complete_shaken', {
    p_vehicle_id: input.vehicleId,
    p_performed_on: input.shaken.performedOn,
    p_new_expiry_date: input.shaken.newExpiryDate,
    p_odometer_km: input.shaken.odometerKm ?? undefined,
    p_note: input.shaken.note,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const completeShakenFn = createServerFn({ method: 'POST' })
  .validator(completeShakenRequestSchema)
  .handler(({ data }) => completeShakenHandler(data, { supabase: createSupabaseServerClient() }))
