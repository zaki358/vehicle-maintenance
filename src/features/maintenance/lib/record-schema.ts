import { z } from 'zod'

import { dateStringSchema } from '@/lib/date/date-string-schema'
import { WORK_TYPES, workTypeFields } from './work-types'

const DETAIL_MAX_LENGTH = 100
const PART_DETAIL_MAX_LENGTH = 200
const OIL_TYPE_MAX_LENGTH = 50
const NOTE_MAX_LENGTH = 1000

/**
 * 整備記録の登録・編集フォーム入力を検証するスキーマ。
 *
 * 必須項目は作業内容の区分によって変わる（部品交換なら交換内容と部品型式、
 * 調整なら調整内容だけ、など）。どの欄をどう扱うかは `workTypeFields()` が
 * 唯一の情報源で、フォームの描画とこの検証が同じ定義を読む。
 *
 * 検証後に、その区分では使わない項目を空へ戻している。フォームで区分を
 * 切り替えたときに前の入力が残っていても、保存される行には持ち込まないため。
 * DB 側の CHECK 制約とも整合する（例: 車検の行に部品型式が入らない）。
 *
 * `odometerKm` の `null` は「走行距離を記録しなかった」という正常値として扱う。
 */
export const recordSchema = z
  .object({
    performedOn: dateStringSchema,
    workType: z.enum(WORK_TYPES, { error: '作業内容を選択してください' }),
    detail: z
      .string()
      .trim()
      .max(DETAIL_MAX_LENGTH, `内容は${DETAIL_MAX_LENGTH}文字以内で入力してください`)
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
      .max(PART_DETAIL_MAX_LENGTH, `部品型式は${PART_DETAIL_MAX_LENGTH}文字以内で入力してください`)
      .default(''),
    oilType: z
      .string()
      .trim()
      .max(OIL_TYPE_MAX_LENGTH, `油種は${OIL_TYPE_MAX_LENGTH}文字以内で入力してください`)
      .default(''),
    elementChanged: z.boolean().default(false),
    note: z
      .string()
      .trim()
      .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
      .default(''),
  })
  .superRefine((data, ctx) => {
    const fields = workTypeFields(data.workType)

    if (fields.detail === 'required' && data.detail.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `${fields.detailLabel}を入力してください`,
        path: ['detail'],
      })
    }

    if (fields.partDetail === 'required' && data.partDetail.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: '部品型式を入力してください',
        path: ['partDetail'],
      })
    }
  })
  .transform((data) => {
    const fields = workTypeFields(data.workType)

    return {
      ...data,
      detail: fields.detail === 'hidden' ? '' : data.detail,
      partDetail: fields.partDetail === 'hidden' ? '' : data.partDetail,
      oilType: fields.oilType ? data.oilType : '',
      elementChanged: fields.elementChanged ? data.elementChanged : false,
    }
  })

export type RecordInput = z.infer<typeof recordSchema>
