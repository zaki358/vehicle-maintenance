import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RecordForm } from './record-form'
import type { DateString } from '@/lib/date/date-string'

describe('RecordForm', () => {
  it('未入力の実施日で送信するとエラーを表示しonSubmitを呼ばない', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('日付は YYYY-MM-DD 形式で、実在する日付を指定してください')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('作業内容「その他」を選ぶと自由入力欄が表示され、未入力なら送信時にエラーになる', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'other')

    expect(screen.getByLabelText('作業内容（自由入力）')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('作業内容が「その他」の場合は内容を入力してください')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('プリセットに戻すと自由入力欄が消えて値がクリアされる', async () => {
    const user = userEvent.setup()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('作業内容'), 'other')
    await user.type(screen.getByLabelText('作業内容（自由入力）'), 'ヘッドライト交換')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'engine_oil')

    expect(screen.queryByLabelText('作業内容（自由入力）')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('作業内容'), 'other')
    expect(screen.getByLabelText('作業内容（自由入力）')).toHaveValue('')
  })

  it('走行距離を未入力で送信すると null として渡す', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'tire')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        performedOn: '2026-09-01',
        workType: 'tire',
        workTypeOther: '',
        odometerKm: null,
        partDetail: '',
        note: '',
      })
    })
  })

  it('走行距離が既存記録と前後関係が逆になっていると警告を表示する（送信はブロックしない）', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    const existingReadings = [{ performedOn: '2026-08-01' as DateString, odometerKm: 15000 }]
    render(
      <RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={existingReadings} onSubmit={onSubmit} />,
    )

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'tire')
    await user.type(screen.getByLabelText('走行距離（km・任意）'), '14000')

    expect(await screen.findByRole('status')).toHaveTextContent('走行距離')

    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ odometerKm: 14000 }))
    })
  })

  it('部品/型式にサジェスト候補を表示する', () => {
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={['日産エンドゥランスオイル 10W-40', 'カストロールGTX']}
        existingReadings={[]}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('日産エンドゥランスオイル 10W-40')).toBeInTheDocument()
    expect(screen.getByText('カストロールGTX')).toBeInTheDocument()
  })

  it('onSubmit がエラーを返したらそのメッセージを表示する', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: '保存に失敗しました' })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'tire')
    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('保存に失敗しました')
  })

  it('初期値があれば各項目に反映する', () => {
    render(
      <RecordForm
        submitLabel="更新"
        partSuggestionsList={[]}
        existingReadings={[]}
        initialValues={{
          performedOn: '2026-09-01' as DateString,
          workType: 'other',
          workTypeOther: 'ヘッドライト交換',
          odometerKm: 12345,
          partDetail: 'H4 LED',
          note: 'メモ',
        }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('実施日')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('作業内容')).toHaveValue('other')
    expect(screen.getByLabelText('作業内容（自由入力）')).toHaveValue('ヘッドライト交換')
    expect(screen.getByLabelText('走行距離（km・任意）')).toHaveValue(12345)
    expect(screen.getByLabelText('部品/型式')).toHaveValue('H4 LED')
    expect(screen.getByLabelText('備考')).toHaveValue('メモ')
  })
})
