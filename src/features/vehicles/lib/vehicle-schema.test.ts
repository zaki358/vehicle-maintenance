import { describe, expect, it } from 'vitest'

import { vehicleSchema } from './vehicle-schema'

describe('vehicleSchema', () => {
  const validInput = {
    name: 'アルファード',
    vehicleType: 'car',
    shakenExpiryDate: '2026-11-30',
    note: '禁煙車',
  }

  it('正しい入力を受理する', () => {
    const result = vehicleSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('前後の空白を trim する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, name: '  アルファード  ', note: '  禁煙車  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('アルファード')
      expect(result.data.note).toBe('禁煙車')
    }
  })

  it('note を省略すると空文字になる（250cc以下のバイク等、備考が無い車両も登録できる）', () => {
    const { note: _note, ...withoutNote } = validInput
    const result = vehicleSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBe('')
    }
  })

  it('shakenExpiryDate が null でも受理する（250cc以下のバイク等、車検が無い車両）', () => {
    const result = vehicleSchema.safeParse({ ...validInput, shakenExpiryDate: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.shakenExpiryDate).toBeNull()
    }
  })

  it('name が空文字だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, name: '' })
    expect(result.success).toBe(false)
  })

  it('name が空白のみだと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('name が51文字以上だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, name: 'あ'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('name がちょうど50文字なら受理する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, name: 'あ'.repeat(50) })
    expect(result.success).toBe(true)
  })

  it('vehicleType が car/motorcycle 以外だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, vehicleType: 'truck' })
    expect(result.success).toBe(false)
  })

  it('shakenExpiryDate が不正な形式だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, shakenExpiryDate: '2026/11/30' })
    expect(result.success).toBe(false)
  })

  it('shakenExpiryDate が実在しない日付だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, shakenExpiryDate: '2026-02-30' })
    expect(result.success).toBe(false)
  })

  it('note が1001文字以上だと拒否する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, note: 'あ'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('note がちょうど1000文字なら受理する', () => {
    const result = vehicleSchema.safeParse({ ...validInput, note: 'あ'.repeat(1000) })
    expect(result.success).toBe(true)
  })
})
