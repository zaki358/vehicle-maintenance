import { z } from 'zod'

import { dateStringSchema } from '@/lib/date/date-string-schema'

const NAME_MAX_LENGTH = 50
const MODEL_CODE_MAX_LENGTH = 50
const NOTE_MAX_LENGTH = 1000

/**
 * 車両の登録・編集フォーム入力を検証するスキーマ。
 *
 * `shakenExpiryDate` の `null` は「250cc 以下のバイク等、車検制度の対象外」を表す
 * 正常値であり、未入力エラーにはしない（詳細は shaken-required.ts）。
 */
export const vehicleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '車種名を入力してください')
    .max(NAME_MAX_LENGTH, `車種名は${NAME_MAX_LENGTH}文字以内で入力してください`),
  modelCode: z
    .string()
    .trim()
    .max(MODEL_CODE_MAX_LENGTH, `型式は${MODEL_CODE_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
  vehicleType: z.enum(['car', 'motorcycle'], { error: '車両区分を選択してください' }),
  shakenExpiryDate: dateStringSchema.nullable(),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
})

export type VehicleInput = z.infer<typeof vehicleSchema>
