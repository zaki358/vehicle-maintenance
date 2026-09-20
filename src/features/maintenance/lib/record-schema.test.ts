import { describe, expect, it } from 'vitest'

import { recordSchema } from './record-schema'

const base = {
  performedOn: '2026-09-20',
  odometerKm: 12000,
  note: '',
}

describe('recordSchema', () => {
  it('エンジンオイルは油種とエレメント交換の有無を受け取る', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'engine_oil',
      oilType: '0W-20',
      elementChanged: true,
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      workType: 'engine_oil',
      oilType: '0W-20',
      elementChanged: true,
      detail: '',
      partDetail: '',
    })
  })

  it('エンジンオイルは内容欄が空でも通る', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'engine_oil' })

    expect(result.success).toBe(true)
    expect(result.data?.elementChanged).toBe(false)
  })

  it('油脂類交換は交換箇所が必須', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'fluid', detail: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('交換箇所を入力してください')
    expect(result.error?.issues[0]?.path).toEqual(['detail'])
  })

  it('油脂類交換は交換箇所と油種を保持する', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'fluid',
      detail: 'ミッション',
      oilType: '75W-90',
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ detail: 'ミッション', oilType: '75W-90' })
  })

  it('部品交換は交換内容が必須', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'part', partDetail: 'ZC33S-001' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('交換内容を入力してください')
  })

  it('部品交換は部品型式も必須', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'part', detail: 'ブレーキパッド' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.message === '部品型式を入力してください')).toBe(true)
  })

  it('部品交換は交換内容と部品型式がそろえば通る', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'part',
      detail: 'ブレーキパッド',
      partDetail: 'ZC33S-001',
    })

    expect(result.success).toBe(true)
  })

  it('修理は部品型式が無くても通る', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'repair', detail: 'エアコン修理' })

    expect(result.success).toBe(true)
    expect(result.data?.partDetail).toBe('')
  })

  it('調整は調整内容が必須', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'adjust', detail: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('調整内容を入力してください')
  })

  it('車検は走行距離と備考だけで通る', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'shaken', note: '指定工場' })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ detail: '', partDetail: '', oilType: '', elementChanged: false })
  })

  it('その他は作業内容が必須', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'other' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('作業内容を入力してください')
  })

  it('区分で使わない項目は保存前に空へ戻す', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'adjust',
      detail: 'アイドリング調整',
      // 区分を切り替える前に入力されていた値が残っている状態
      partDetail: '消えるはず',
      oilType: '消えるはず',
      elementChanged: true,
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ partDetail: '', oilType: '', elementChanged: false })
  })

  it('走行距離は未記録（null）を許容する', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'engine_oil', odometerKm: null })

    expect(result.success).toBe(true)
    expect(result.data?.odometerKm).toBeNull()
  })

  it('走行距離が負の数ならエラー', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'engine_oil', odometerKm: -1 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('走行距離は0以上で入力してください')
  })

  it('走行距離が小数ならエラー', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'engine_oil', odometerKm: 1.5 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('走行距離は整数で入力してください')
  })

  it('作業日の形式が不正ならエラー', () => {
    const result = recordSchema.safeParse({ ...base, performedOn: '2026-02-30', workType: 'engine_oil' })

    expect(result.success).toBe(false)
  })

  it('未知の作業内容はエラー', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'tire' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('作業内容を選択してください')
  })

  it('内容・部品型式・備考・油種の前後の空白は取り除く', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'part',
      detail: '  ブレーキパッド  ',
      partDetail: '  ZC33S-001  ',
      oilType: '  ',
      note: '  交換済み  ',
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      detail: 'ブレーキパッド',
      partDetail: 'ZC33S-001',
      note: '交換済み',
    })
  })

  it('空白だけの内容は未入力として扱う', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'adjust', detail: '   ' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('調整内容を入力してください')
  })

  it('内容が長すぎるとエラー', () => {
    const result = recordSchema.safeParse({ ...base, workType: 'adjust', detail: 'あ'.repeat(101) })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('内容は100文字以内で入力してください')
  })

  it('備考が長すぎるとエラー', () => {
    const result = recordSchema.safeParse({
      ...base,
      workType: 'engine_oil',
      note: 'あ'.repeat(1001),
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('備考は1000文字以内で入力してください')
  })
})
