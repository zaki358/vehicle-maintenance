import { z } from 'zod'

/**
 * 「どの車両に属する整備記録か」を検証するスキーマ。
 *
 * `list`/`list-part-details`サーバー関数の入口で使う。`create`では
 * `.extend({ record: recordSchema })`で整備記録本体のスキーマと合成する
 * （`recordSchema`は`.refine()`で作られたZodEffectsのため`.shape`を持たず
 * 直接`.extend()`できない。ネストしたフィールドとして持たせれば制約なく合成できる）。
 * 存在しない・他人の車両かどうかの判定はRLSに委ねる（このスキーマの責務外）。
 */
export const vehicleScopeSchema = z.object({
  vehicleId: z.uuid('車両IDの形式が正しくありません'),
})

export type VehicleScopeInput = z.infer<typeof vehicleScopeSchema>
