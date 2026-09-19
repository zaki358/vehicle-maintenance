import { z } from 'zod'

/**
 * 整備記録IDを検証するスキーマ。`update`/`delete`サーバー関数の入口で使う。
 * `vehicle-id-schema.ts`（vehiclesフィーチャー）と同型だが、検証対象が別のリソース
 * （整備記録）であることをエラーメッセージと型名で明示するため独立させている。
 */
export const recordIdSchema = z.object({
  id: z.uuid('整備記録IDの形式が正しくありません'),
})

export type RecordIdInput = z.infer<typeof recordIdSchema>
