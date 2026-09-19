import { z } from 'zod'

import { dateStringSchema } from '@/lib/date/date-string-schema'

const PART_DETAIL_MAX_LENGTH = 200
const NOTE_MAX_LENGTH = 1000

/**
 * 車検完了フォームの入力を検証するスキーマ。
 *
 * `newExpiryDate` は `renewal.ts` の `computeNextShakenExpiry` が算出した
 * 提案値を画面側で表示し、利用者が手動修正できる前提のフィールドのため、
 * ここでは「実在する日付か」だけを検証する。`performedOn` との前後関係を
 * 強制しないのは、手動修正の結果が制度どおりの計算と一致しない場合が
 * ありうるため（要件どおり、計算結果はあくまで提案）。
 */
export const completeShakenSchema = z.object({
  performedOn: dateStringSchema,
  newExpiryDate: dateStringSchema,
  odometerKm: z
    .number()
    .int('走行距離は整数で入力してください')
    .nonnegative('走行距離は0以上で入力してください')
    .nullable()
    .default(null),
  partDetail: z
    .string()
    .trim()
    .max(PART_DETAIL_MAX_LENGTH, `部品/型式は${PART_DETAIL_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
})

export type CompleteShakenInput = z.infer<typeof completeShakenSchema>
