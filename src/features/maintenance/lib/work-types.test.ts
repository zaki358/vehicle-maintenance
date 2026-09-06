import { describe, expect, it } from 'vitest'

import { WORK_TYPES, isOtherWorkType, workTypeLabel } from './work-types'

describe('WORK_TYPES', () => {
  it('7種類のプリセット（その他込み）を定義している', () => {
    expect(WORK_TYPES).toEqual([
      'engine_oil',
      'oil_element',
      'tire',
      'brake_pad',
      'battery',
      'shaken',
      'other',
    ])
  })
})

describe('workTypeLabel', () => {
  it.each([
    ['engine_oil', 'エンジンオイル'],
    ['oil_element', 'オイルエレメント'],
    ['tire', 'タイヤ'],
    ['brake_pad', 'ブレーキパッド'],
    ['battery', 'バッテリー'],
    ['shaken', '車検'],
    ['other', 'その他'],
  ] as const)('%s は「%s」と表示する', (type, label) => {
    expect(workTypeLabel(type)).toBe(label)
  })
})

describe('isOtherWorkType', () => {
  it('other なら true', () => {
    expect(isOtherWorkType('other')).toBe(true)
  })

  it('other 以外なら false', () => {
    expect(isOtherWorkType('engine_oil')).toBe(false)
    expect(isOtherWorkType('shaken')).toBe(false)
  })
})
