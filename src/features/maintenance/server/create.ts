import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { recordSchema } from '../lib/record-schema'
import { vehicleScopeSchema } from '../lib/vehicle-scope-schema'
import type { MaintenanceRecordRow } from './list'

/**
 * `recordSchema` は `.refine()` で作られた ZodEffects のため `.shape` を持たず、
 * `vehicleScopeSchema.extend(recordSchema.shape)` の形では合成できない
 * （vehicles/server/update.ts の `vehicleIdSchema.extend(vehicleSchema.shape)` と
 * 対称的な制約）。`record` フィールドとしてネストさせれば、内側のスキーマの型を
 * 問わず合成できる。
 */
const createRecordSchema = vehicleScopeSchema.extend({ record: recordSchema })

export type CreateRecordInput = z.infer<typeof createRecordSchema>

interface CreateRecordDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 整備記録を新規作成する。`user_id` を渡さないのは vehicles/server/create.ts と同じ理由
 * （既定値 `auth.uid()` に委ね、クライアントによる詐称の余地を無くす）。
 */
export async function createRecordHandler(
  input: CreateRecordInput,
  deps: CreateRecordDeps,
): Promise<MaintenanceRecordRow> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .insert({
      vehicle_id: input.vehicleId,
      performed_on: input.record.performedOn,
      work_type: input.record.workType,
      detail: input.record.detail,
      odometer_km: input.record.odometerKm,
      part_detail: input.record.partDetail,
      oil_type: input.record.oilType,
      element_changed: input.record.elementChanged,
      note: input.record.note,
    })
    .select()
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const createRecordFn = createServerFn({ method: 'POST' })
  .validator(createRecordSchema)
  .handler(({ data }) => createRecordHandler(data, { supabase: createSupabaseServerClient() }))
