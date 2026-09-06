import { describe, expect, it } from 'vitest'

import { recordSchema } from './record-schema'

describe('recordSchema', () => {
  const validInput = {
    performedOn: '2026-09-06',
    workType: 'engine_oil',
    workTypeOther: '',
    odometerKm: 12345,
    partDetail: '日産エンドゥランスオイル 10W-40',
    note: '次回は半年後',
  }

  it('正しい入力を受理する', () => {
    const result = recordSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('workTypeOther / partDetail / note / odometerKm を省略すると既定値になる', () => {
    const result = recordSchema.safeParse({ performedOn: '2026-09-06', workType: 'tire' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.workTypeOther).toBe('')
      expect(result.data.partDetail).toBe('')
      expect(result.data.note).toBe('')
      expect(result.data.odometerKm).toBeNull()
    }
  })

  it('performedOn が不正な形式だと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, performedOn: '2026/09/06' })
    expect(result.success).toBe(false)
  })

  it('workType がプリセット外だと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, workType: 'wash' })
    expect(result.success).toBe(false)
  })

  it('workType が other で workTypeOther が空文字だと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, workType: 'other', workTypeOther: '' })
    expect(result.success).toBe(false)
  })

  it('workType が other で workTypeOther が空白のみだと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, workType: 'other', workTypeOther: '   ' })
    expect(result.success).toBe(false)
  })

  it('workType が other でも workTypeOther を入力していれば受理する', () => {
    const result = recordSchema.safeParse({ ...validInput, workType: 'other', workTypeOther: '洗車' })
    expect(result.success).toBe(true)
  })

  it('workType が other 以外なら workTypeOther が空文字でも受理する', () => {
    const result = recordSchema.safeParse({ ...validInput, workType: 'tire', workTypeOther: '' })
    expect(result.success).toBe(true)
  })

  it('odometerKm が負の数だと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, odometerKm: -1 })
    expect(result.success).toBe(false)
  })

  it('odometerKm が小数だと拒否する', () => {
    const result = recordSchema.safeParse({ ...validInput, odometerKm: 12345.6 })
    expect(result.success).toBe(false)
  })

  it('odometerKm が null でも受理する（走行距離不明の記録）', () => {
    const result = recordSchema.safeParse({ ...validInput, odometerKm: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.odometerKm).toBeNull()
    }
  })

  it('odometerKm が 0 でも受理する', () => {
    const result = recordSchema.safeParse({ ...validInput, odometerKm: 0 })
    expect(result.success).toBe(true)
  })

  it('partDetail / note の前後の空白を trim する', () => {
    const result = recordSchema.safeParse({ ...validInput, partDetail: '  部品  ', note: '  備考  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.partDetail).toBe('部品')
      expect(result.data.note).toBe('備考')
    }
  })
})
