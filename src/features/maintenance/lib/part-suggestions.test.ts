import { describe, expect, it } from 'vitest'

import { partSuggestions } from './part-suggestions'

type TestRecord = { partDetail: string }

describe('partSuggestions', () => {
  it('過去入力値を重複なく、登場順で返す', () => {
    const records: TestRecord[] = [
      { partDetail: '日産エンドゥランスオイル 10W-40' },
      { partDetail: 'ブリヂストン ニューエクステンザ' },
      { partDetail: '日産エンドゥランスオイル 10W-40' },
    ]
    expect(partSuggestions(records)).toEqual(['日産エンドゥランスオイル 10W-40', 'ブリヂストン ニューエクステンザ'])
  })

  it('空文字の部品/型式は候補に含めない', () => {
    const records: TestRecord[] = [{ partDetail: '' }, { partDetail: 'タイヤ' }]
    expect(partSuggestions(records)).toEqual(['タイヤ'])
  })

  it('前後の空白だけの値も候補に含めない', () => {
    const records: TestRecord[] = [{ partDetail: '   ' }]
    expect(partSuggestions(records)).toEqual([])
  })

  it('query を指定すると部分一致するものだけに絞り込む', () => {
    const records: TestRecord[] = [{ partDetail: 'エンジンオイル A' }, { partDetail: 'ブレーキパッド B' }]
    expect(partSuggestions(records, 'オイル')).toEqual(['エンジンオイル A'])
  })

  it('query が空文字なら絞り込まない', () => {
    const records: TestRecord[] = [{ partDetail: 'エンジンオイル A' }, { partDetail: 'ブレーキパッド B' }]
    expect(partSuggestions(records, '')).toEqual(['エンジンオイル A', 'ブレーキパッド B'])
  })

  it('該当が無ければ空配列を返す', () => {
    const records: TestRecord[] = [{ partDetail: 'タイヤ' }]
    expect(partSuggestions(records, 'バッテリー')).toEqual([])
  })

  it('記録が空なら空配列を返す', () => {
    expect(partSuggestions([])).toEqual([])
  })
})
