import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ShakenForm } from './complete-shaken-form'
import type { DateString } from '@/lib/date/date-string'

describe('ShakenForm', () => {
  it('未入力の実施日で送信するとエラーを表示しonSubmitを呼ばない', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ShakenForm currentExpiry={null} submitLabel="車検完了を記録" onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '車検完了を記録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('日付は YYYY-MM-DD 形式で、実在する日付を指定してください')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('実施日を入力すると新しい満了日が制度どおりに自動計算される（繰り越し）', async () => {
    const user = userEvent.setup()
    render(
      <ShakenForm
        currentExpiry={'2026-11-30' as DateString}
        submitLabel="車検完了を記録"
        onSubmit={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('受検日'), '2026-10-30')

    expect(screen.getByLabelText('新しい満了日')).toHaveValue('2028-11-30')
  })

  it('有効期間を3年に切り替えると新しい満了日が再計算される', async () => {
    const user = userEvent.setup()
    render(
      <ShakenForm
        currentExpiry={'2026-11-30' as DateString}
        submitLabel="車検完了を記録"
        onSubmit={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('受検日'), '2026-10-30')
    await user.selectOptions(screen.getByLabelText('有効期間'), '3')

    expect(screen.getByLabelText('新しい満了日')).toHaveValue('2029-11-30')
  })

  it('新しい満了日を手動で修正すると、その値がそのまま使われる', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(
      <ShakenForm
        currentExpiry={'2026-11-30' as DateString}
        submitLabel="車検完了を記録"
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('受検日'), '2026-10-30')
    await user.clear(screen.getByLabelText('新しい満了日'))
    await user.type(screen.getByLabelText('新しい満了日'), '2028-12-15')
    await user.click(screen.getByRole('button', { name: '車検完了を記録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ newExpiryDate: '2028-12-15' }))
    })
  })

  it('受検日を変更すると手動修正した満了日はリセットされ再計算される', async () => {
    const user = userEvent.setup()
    render(
      <ShakenForm
        currentExpiry={'2026-11-30' as DateString}
        submitLabel="車検完了を記録"
        onSubmit={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('受検日'), '2026-10-30')
    await user.clear(screen.getByLabelText('新しい満了日'))
    await user.type(screen.getByLabelText('新しい満了日'), '2028-12-15')

    await user.clear(screen.getByLabelText('受検日'))
    await user.type(screen.getByLabelText('受検日'), '2026-11-16')

    expect(screen.getByLabelText('新しい満了日')).toHaveValue('2028-11-30')
  })

  it('走行距離未入力で送信すると null として渡す', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<ShakenForm currentExpiry={null} submitLabel="車検完了を記録" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('受検日'), '2026-09-06')
    await user.click(screen.getByRole('button', { name: '車検完了を記録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        performedOn: '2026-09-06',
        newExpiryDate: '2028-09-06',
        odometerKm: null,
        partDetail: '',
        note: '',
      })
    })
  })

  it('onSubmit がエラーを返したらそのメッセージを表示する', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: '保存に失敗しました' })
    render(<ShakenForm currentExpiry={null} submitLabel="車検完了を記録" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('受検日'), '2026-09-06')
    await user.click(screen.getByRole('button', { name: '車検完了を記録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('保存に失敗しました')
  })
})
