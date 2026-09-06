import { describe, expect, it } from 'vitest'

import { vehicleTypeLabel } from './vehicle-type'

describe('vehicleTypeLabel', () => {
  it('car は「車」と表示する', () => {
    expect(vehicleTypeLabel('car')).toBe('車')
  })

  it('motorcycle は「バイク」と表示する', () => {
    expect(vehicleTypeLabel('motorcycle')).toBe('バイク')
  })
})
