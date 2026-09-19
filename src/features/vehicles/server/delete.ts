import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { vehicleIdSchema } from '../lib/vehicle-id-schema'
import type { VehicleIdInput } from '../lib/vehicle-id-schema'

interface DeleteVehicleDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 車両を削除する。マイグレーションで `maintenance_records` の
 * `vehicle_id` 外部キーに `on delete cascade` を設定済みのため、
 * 紐づく整備記録も同時に削除される（アプリ側で個別に消す必要はない）。
 *
 * 存在しない・他人の車両を指定しても RLS が対象行を 0 件にするだけで
 * エラーにはならない（副作用のない no-op として扱う）。
 */
export async function deleteVehicleHandler(input: VehicleIdInput, deps: DeleteVehicleDeps): Promise<void> {
  const { error } = await deps.supabase.from('vehicles').delete().eq('id', input.id)
  if (error) {
    throw new Error(error.message)
  }
}

export const deleteVehicleFn = createServerFn({ method: 'POST' })
  .validator(vehicleIdSchema)
  .handler(({ data }) => deleteVehicleHandler(data, { supabase: createSupabaseServerClient() }))
