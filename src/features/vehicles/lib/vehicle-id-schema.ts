import { z } from 'zod'

/**
 * 車両IDを検証するスキーマ。`get`/`update`/`delete` サーバー関数の入口で使う。
 *
 * UUID形式を外れる値をDBへ渡す前に弾くことで、無駄な問い合わせを避ける。
 * 存在しない・他人の車両かどうかの判定はRLSに委ねる（このスキーマの責務外）。
 */
export const vehicleIdSchema = z.object({
  id: z.uuid('車両IDの形式が正しくありません'),
})

export type VehicleIdInput = z.infer<typeof vehicleIdSchema>
