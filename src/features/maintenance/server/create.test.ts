import { describe, expect, it, vi } from 'vitest'

import { createRecordHandler } from './create'

describe('createRecordHandler', () => {
  it('入力をDB列名にマッピングして挿入し、作成された行を返す', async () => {
    const row = { id: 'r1' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })

    const result = await createRecordHandler(
      {
        vehicleId: 'v1',
        record: {
          performedOn: '2026-09-01' as never,
          workType: 'engine_oil',
          detail: '',
          odometerKm: 12000,
          partDetail: '',
          oilType: '10W-40',
          elementChanged: true,
          note: '',
        },
      },
      { supabase: { from } },
    )

    expect(result).toBe(row)
    expect(from).toHaveBeenCalledWith('maintenance_records')
    expect(insert).toHaveBeenCalledWith({
      vehicle_id: 'v1',
      performed_on: '2026-09-01',
      work_type: 'engine_oil',
      detail: '',
      odometer_km: 12000,
      part_detail: '',
      oil_type: '10W-40',
      element_changed: true,
      note: '',
    })
  })

  it('エラー時は例外を投げる', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const from = vi.fn().mockReturnValue({ insert })

    await expect(
      createRecordHandler(
        {
          vehicleId: 'v1',
          record: {
            performedOn: '2026-09-01' as never,
            workType: 'part',
            detail: 'ブレーキパッド',
            odometerKm: null,
            partDetail: 'ZC33S-001',
            oilType: '',
            elementChanged: false,
            note: '',
          },
        },
        { supabase: { from } },
      ),
    ).rejects.toThrow('boom')
  })
})
