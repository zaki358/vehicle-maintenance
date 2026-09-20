/**
 * 整備記録の作業内容。DB の `work_type` 列にそのまま保存する値。
 *
 * 旧版は「エンジンオイル/タイヤ/ブレーキパッド…」と交換対象そのものを区分に
 * していたため、対象が増えるたびに区分が増える構造だった。この9区分は
 * 「どういう作業か」で分け、具体的な対象は `detail`（交換内容・修理内容など）に書く。
 */
export const WORK_TYPES = [
  'engine_oil',
  'fluid',
  'part',
  'repair',
  'adjust',
  'tuning',
  'modification',
  'shaken',
  'other',
] as const

export type WorkType = (typeof WORK_TYPES)[number]

/** 入力欄の扱い。`hidden` はその区分では使わない項目。 */
export type FieldRequirement = 'required' | 'optional' | 'hidden'

export interface WorkTypeFields {
  /** 作業の内容を書く欄（DB の detail 列）。 */
  detail: FieldRequirement
  /** detail 欄の見出し。区分ごとに意味が変わるため固定ラベルにしない。 */
  detailLabel: string
  /** 部品型式（DB の part_detail 列）。 */
  partDetail: FieldRequirement
  /** 油種（DB の oil_type 列）を使うか。 */
  oilType: boolean
  /** エレメント交換の有無（DB の element_changed 列）を使うか。 */
  elementChanged: boolean
}

/** 画面表示用の日本語ラベル。 */
export function workTypeLabel(type: WorkType): string {
  switch (type) {
    case 'engine_oil':
      return 'エンジンオイル'
    case 'fluid':
      return '油脂類交換'
    case 'part':
      return '部品交換'
    case 'repair':
      return '修理'
    case 'adjust':
      return '調整'
    case 'tuning':
      return 'チューニング'
    case 'modification':
      return '改造'
    case 'shaken':
      return '車検'
    case 'other':
      return 'その他'
  }
}

const HIDDEN_DETAIL = { detail: 'hidden', detailLabel: '' } as const

/**
 * 区分ごとに、どの入力欄を出すか・必須かを返す。
 *
 * フォーム（どの欄を描画するか）と record-schema（何を必須にするか）の
 * 両方がこの1か所を参照する。画面と検証がずれないようにするための単一の情報源。
 */
export function workTypeFields(type: WorkType): WorkTypeFields {
  switch (type) {
    case 'engine_oil':
      return { ...HIDDEN_DETAIL, partDetail: 'hidden', oilType: true, elementChanged: true }
    case 'fluid':
      return {
        detail: 'required',
        detailLabel: '交換箇所',
        partDetail: 'hidden',
        oilType: true,
        elementChanged: false,
      }
    case 'part':
      return {
        detail: 'required',
        detailLabel: '交換内容',
        partDetail: 'required',
        oilType: false,
        elementChanged: false,
      }
    case 'repair':
      return {
        detail: 'required',
        detailLabel: '修理内容',
        partDetail: 'optional',
        oilType: false,
        elementChanged: false,
      }
    case 'adjust':
      return {
        detail: 'required',
        detailLabel: '調整内容',
        partDetail: 'hidden',
        oilType: false,
        elementChanged: false,
      }
    case 'tuning':
      return {
        detail: 'required',
        detailLabel: 'チューニング内容',
        partDetail: 'optional',
        oilType: false,
        elementChanged: false,
      }
    case 'modification':
      return {
        detail: 'required',
        detailLabel: '改造内容',
        partDetail: 'optional',
        oilType: false,
        elementChanged: false,
      }
    case 'shaken':
      return { ...HIDDEN_DETAIL, partDetail: 'hidden', oilType: false, elementChanged: false }
    case 'other':
      return {
        detail: 'required',
        detailLabel: '作業内容',
        partDetail: 'optional',
        oilType: false,
        elementChanged: false,
      }
  }
}

/**
 * 車検かどうか。車検の記録は満了日の更新を伴うため、
 * 他の区分とは別の経路（complete_shaken RPC）で保存する。
 */
export function isShakenWorkType(type: WorkType): boolean {
  return type === 'shaken'
}
