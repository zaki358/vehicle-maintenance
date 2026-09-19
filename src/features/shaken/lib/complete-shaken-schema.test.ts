import { describe, expect, it } from 'vitest'

import { completeShakenSchema } from './complete-shaken-schema'

describe('completeShakenSchema', () => {
  const validInput = {
    performedOn: '2026-09-06',
    newExpiryDate: '2028-09-06',
    odometerKm: 12345,
    partDetail: '継続検査',
    note: '特に指摘なし',
  }

  it('正しい入力を受理する', () => {
    const result = completeShakenSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('odometerKm / partDetail / note を省略すると既定値になる', () => {
    const result = completeShakenSchema.safeParse({
      performedOn: '2026-09-06',
      newExpiryDate: '2028-09-06',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.odometerKm).toBeNull()
      expect(result.data.partDetail).toBe('')
      expect(result.data.note).toBe('')
    }
  })

  it('performedOn が不正な形式だと拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, performedOn: '2026/09/06' })
    expect(result.success).toBe(false)
  })

  it('newExpiryDate が不正な形式だと拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, newExpiryDate: '2028/09/06' })
    expect(result.success).toBe(false)
  })

  it('odometerKm が負の数だと拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, odometerKm: -1 })
    expect(result.success).toBe(false)
  })

  it('odometerKm が小数だと拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, odometerKm: 12345.6 })
    expect(result.success).toBe(false)
  })

  it('odometerKm が null でも受理する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, odometerKm: null })
    expect(result.success).toBe(true)
  })

  it('partDetail / note の前後の空白を trim する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, partDetail: '  継続検査  ', note: '  特記なし  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.partDetail).toBe('継続検査')
      expect(result.data.note).toBe('特記なし')
    }
  })

  it('partDetail が200文字を超えると拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, partDetail: 'あ'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('note が1000文字を超えると拒否する', () => {
    const result = completeShakenSchema.safeParse({ ...validInput, note: 'あ'.repeat(1001) })
    expect(result.success).toBe(false)
  })
})
