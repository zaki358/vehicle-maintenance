import { describe, expect, it } from 'vitest'

import { recordIdSchema } from './record-id-schema'

describe('recordIdSchema', () => {
  it('UUID形式のidを受け入れる', () => {
    const result = recordIdSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111' })

    expect(result.success).toBe(true)
  })

  it('UUID形式でなければ拒否する', () => {
    const result = recordIdSchema.safeParse({ id: 'not-a-uuid' })

    expect(result.success).toBe(false)
  })
})
