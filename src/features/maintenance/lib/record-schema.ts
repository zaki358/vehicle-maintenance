import { z } from 'zod'

import { dateStringSchema } from '@/lib/date/date-string-schema'
import { WORK_TYPES, isOtherWorkType } from './work-types'

const WORK_TYPE_OTHER_MAX_LENGTH = 50
const PART_DETAIL_MAX_LENGTH = 200
const NOTE_MAX_LENGTH = 1000

/**
 * 整備記録の登録・編集フォーム入力を検証するスキーマ。
 *
 * `odometerKm` の `null` は「走行距離を記録しなかった」という正常値として扱う
 * （`dashboard/lib/since-last-service.ts` 側で欠損として扱う想定）。
 *
 * `workType` が `other`（その他）のときだけ `workTypeOther` の自由入力を必須にする
 * ルールは、単一フィールドの制約では表現できないため `.refine()` で検証する。
 */
export const recordSchema = z
  .object({
    performedOn: dateStringSchema,
    workType: z.enum(WORK_TYPES, { error: '作業内容を選択してください' }),
    workTypeOther: z
      .string()
      .trim()
      .max(WORK_TYPE_OTHER_MAX_LENGTH, `作業内容は${WORK_TYPE_OTHER_MAX_LENGTH}文字以内で入力してください`)
      .default(''),
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
  .refine((data) => !isOtherWorkType(data.workType) || data.workTypeOther.length > 0, {
    message: '作業内容が「その他」の場合は内容を入力してください',
    path: ['workTypeOther'],
  })

export type RecordInput = z.infer<typeof recordSchema>
