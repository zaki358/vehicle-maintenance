import { z } from 'zod'

import { isDateString } from '@/lib/date/date-string'

const NAME_MAX_LENGTH = 50
const NOTE_MAX_LENGTH = 1000

/**
 * `YYYY-MM-DD` かつ実在する日付の文字列を DateString として受理する。
 * `isDateString` は date-string.ts と同じ検証（うるう年・月末日など）を共有する。
 */
const dateStringSchema = z.string().transform((value, ctx) => {
  if (!isDateString(value)) {
    ctx.addIssue({ code: 'custom', message: '日付は YYYY-MM-DD 形式で、実在する日付を指定してください' })
    return z.NEVER
  }
  return value
})

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
  vehicleType: z.enum(['car', 'motorcycle'], { error: '車両区分を選択してください' }),
  shakenExpiryDate: dateStringSchema.nullable(),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
})

export type VehicleInput = z.infer<typeof vehicleSchema>
