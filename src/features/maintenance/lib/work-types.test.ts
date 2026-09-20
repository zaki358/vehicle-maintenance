import { describe, expect, it } from 'vitest'

import { WORK_TYPES, isShakenWorkType, workTypeFields, workTypeLabel } from './work-types'
import type { WorkType } from './work-types'

describe('WORK_TYPES', () => {
  it('9区分を定義順に持つ', () => {
    expect(WORK_TYPES).toEqual([
      'engine_oil',
      'fluid',
      'part',
      'repair',
      'adjust',
      'tuning',
      'modification',
      'shaken',
      'other',
    ])
  })
})

describe('workTypeLabel', () => {
  it('全区分に日本語ラベルがある', () => {
    const labels = WORK_TYPES.map(workTypeLabel)

    expect(labels).toEqual([
      'エンジンオイル',
      '油脂類交換',
      '部品交換',
      '修理',
      '調整',
      'チューニング',
      '改造',
      '車検',
      'その他',
    ])
  })
})

describe('workTypeFields', () => {
  it('エンジンオイルは油種とエレメント交換の有無を使い、内容欄は持たない', () => {
    expect(workTypeFields('engine_oil')).toEqual({
      detail: 'hidden',
      detailLabel: '',
      partDetail: 'hidden',
      oilType: true,
      elementChanged: true,
    })
  })

  it('油脂類交換は交換箇所と油種を使う', () => {
    expect(workTypeFields('fluid')).toEqual({
      detail: 'required',
      detailLabel: '交換箇所',
      partDetail: 'hidden',
      oilType: true,
      elementChanged: false,
    })
  })

  it('部品交換は交換内容と部品型式の両方が必須', () => {
    expect(workTypeFields('part')).toEqual({
      detail: 'required',
      detailLabel: '交換内容',
      partDetail: 'required',
      oilType: false,
      elementChanged: false,
    })
  })

  it('修理は修理内容が必須で、部品型式は任意', () => {
    expect(workTypeFields('repair')).toEqual({
      detail: 'required',
      detailLabel: '修理内容',
      partDetail: 'optional',
      oilType: false,
      elementChanged: false,
    })
  })

  it('調整は調整内容だけを使い、部品型式は持たない', () => {
    expect(workTypeFields('adjust')).toEqual({
      detail: 'required',
      detailLabel: '調整内容',
      partDetail: 'hidden',
      oilType: false,
      elementChanged: false,
    })
  })

  it('チューニングと改造は内容が必須で部品型式は任意', () => {
    expect(workTypeFields('tuning').detailLabel).toBe('チューニング内容')
    expect(workTypeFields('tuning').partDetail).toBe('optional')
    expect(workTypeFields('modification').detailLabel).toBe('改造内容')
    expect(workTypeFields('modification').partDetail).toBe('optional')
  })

  it('車検は走行距離と備考しか使わない', () => {
    expect(workTypeFields('shaken')).toEqual({
      detail: 'hidden',
      detailLabel: '',
      partDetail: 'hidden',
      oilType: false,
      elementChanged: false,
    })
  })

  it('その他は作業内容が必須で部品型式は任意', () => {
    expect(workTypeFields('other')).toEqual({
      detail: 'required',
      detailLabel: '作業内容',
      partDetail: 'optional',
      oilType: false,
      elementChanged: false,
    })
  })

  it('内容欄を持つ区分には必ずラベルがある', () => {
    for (const type of WORK_TYPES) {
      const fields = workTypeFields(type)
      if (fields.detail === 'required') {
        expect(fields.detailLabel.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('isShakenWorkType', () => {
  it('車検のときだけ true', () => {
    expect(isShakenWorkType('shaken')).toBe(true)
    const others = WORK_TYPES.filter((type): type is WorkType => type !== 'shaken')
    for (const type of others) {
      expect(isShakenWorkType(type)).toBe(false)
    }
  })
})
