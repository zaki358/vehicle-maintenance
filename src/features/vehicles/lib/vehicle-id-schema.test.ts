import { describe, expect, it } from 'vitest'

import { vehicleIdSchema } from './vehicle-id-schema'

describe('vehicleIdSchema', () => {
  it('UUID形式のidを受け入れる', () => {
    const result = vehicleIdSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' })

    expect(result.success).toBe(true)
  })

  it('UUID形式でないidを拒否する', () => {
    const result = vehicleIdSchema.safeParse({ id: 'not-a-uuid' })

    expect(result.success).toBe(false)
  })

  it('idが無ければ拒否する', () => {
    const result = vehicleIdSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})
