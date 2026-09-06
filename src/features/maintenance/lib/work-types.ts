/**
 * 整備記録の作業内容プリセット。DB の `work_type` 列にそのまま保存する値。
 * `other` を選んだ場合のみ `work_type_other` に自由入力が必須になる
 * （詳細は record-schema.ts）。
 */
export const WORK_TYPES = [
  'engine_oil',
  'oil_element',
  'tire',
  'brake_pad',
  'battery',
  'shaken',
  'other',
] as const

export type WorkType = (typeof WORK_TYPES)[number]

/** 画面表示用の日本語ラベル。 */
export function workTypeLabel(type: WorkType): string {
  switch (type) {
    case 'engine_oil':
      return 'エンジンオイル'
    case 'oil_element':
      return 'オイルエレメント'
    case 'tire':
      return 'タイヤ'
    case 'brake_pad':
      return 'ブレーキパッド'
    case 'battery':
      return 'バッテリー'
    case 'shaken':
      return '車検'
    case 'other':
      return 'その他'
  }
}

/** `other`（自由入力）を選んだかどうか。record-schema.ts の必須判定に使う。 */
export function isOtherWorkType(type: WorkType): boolean {
  return type === 'other'
}
