import { describe, expect, it } from 'vitest'

import { vehicleScopeSchema } from './vehicle-scope-schema'

describe('vehicleScopeSchema', () => {
  it('UUID形式のvehicleIdを受け入れる', () => {
    const result = vehicleScopeSchema.safeParse({ vehicleId: '11111111-1111-4111-8111-111111111111' })

    expect(result.success).toBe(true)
  })

  it('UUID形式でなければ拒否する', () => {
    const result = vehicleScopeSchema.safeParse({ vehicleId: 'not-a-uuid' })

    expect(result.success).toBe(false)
  })
})
