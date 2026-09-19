import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { recordIdSchema } from '../lib/record-id-schema'
import type { RecordIdInput } from '../lib/record-id-schema'

interface DeleteRecordDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}

/**
 * 整備記録を削除する。存在しない・他人の記録を指定してもRLSが対象行を0件にする
 * だけでエラーにはならない（vehicles/server/delete.tsと同じ、副作用のないno-op）。
 */
export async function deleteRecordHandler(input: RecordIdInput, deps: DeleteRecordDeps): Promise<void> {
  const { error } = await deps.supabase.from('maintenance_records').delete().eq('id', input.id)
  if (error) {
    throw new Error(error.message)
  }
}

export const deleteRecordFn = createServerFn({ method: 'POST' })
  .validator(recordIdSchema)
  .handler(({ data }) => deleteRecordHandler(data, { supabase: createSupabaseServerClient() }))
