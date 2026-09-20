import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { recordIdSchema } from '../lib/record-id-schema'
import { recordSchema } from '../lib/record-schema'
import type { MaintenanceRecordRow } from './list'

/** create.ts と同じ理由で `record` フィールドとしてネストさせて合成する。 */
const updateRecordSchema = recordIdSchema.extend({ record: recordSchema })

export type UpdateRecordInput = z.infer<typeof updateRecordSchema>

interface UpdateRecordDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 整備記録を更新する。存在しない・他人の記録（RLSがブロック）は区別せず `null` を返す。
 * vehicles/server/update.ts と同じ理由（他人のIDが存在するという情報を漏らさない）。
 * `vehicle_id` は更新対象に含めない（記録を別の車両へ付け替える操作は提供しない）。
 */
export async function updateRecordHandler(
  input: UpdateRecordInput,
  deps: UpdateRecordDeps,
): Promise<MaintenanceRecordRow | null> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .update({
      performed_on: input.record.performedOn,
      work_type: input.record.workType,
      detail: input.record.detail,
      odometer_km: input.record.odometerKm,
      part_detail: input.record.partDetail,
      oil_type: input.record.oilType,
      element_changed: input.record.elementChanged,
      note: input.record.note,
    })
    .eq('id', input.id)
    .select()
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const updateRecordFn = createServerFn({ method: 'POST' })
  .validator(updateRecordSchema)
  .handler(({ data }) => updateRecordHandler(data, { supabase: createSupabaseServerClient() }))
