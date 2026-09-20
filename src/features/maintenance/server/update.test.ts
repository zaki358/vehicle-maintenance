import { describe, expect, it, vi } from 'vitest'

import { updateRecordHandler } from './update'

describe('updateRecordHandler', () => {
  it('入力をDB列名にマッピングして更新し、更新後の行を返す', async () => {
    const row = { id: 'r1' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    const result = await updateRecordHandler(
      {
        id: 'r1',
        record: {
          performedOn: '2026-09-01' as never,
          workType: 'part',
          detail: 'ヘッドライトバルブ交換',
          odometerKm: 13500,
          partDetail: 'H4 LEDバルブ',
          oilType: '',
          elementChanged: false,
          note: 'メモ',
        },
      },
      { supabase: { from } },
    )

    expect(result).toBe(row)
    expect(from).toHaveBeenCalledWith('maintenance_records')
    expect(update).toHaveBeenCalledWith({
      performed_on: '2026-09-01',
      work_type: 'part',
      detail: 'ヘッドライトバルブ交換',
      odometer_km: 13500,
      part_detail: 'H4 LEDバルブ',
      oil_type: '',
      element_changed: false,
      note: 'メモ',
    })
    expect(eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('存在しない・他人の記録なら null を返す', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    const result = await updateRecordHandler(
      {
        id: 'missing',
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
    )

    expect(result).toBeNull()
  })

  it('エラー時は例外を投げる', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ maybeSingle })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })

    await expect(
      updateRecordHandler(
        {
          id: 'r1',
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
