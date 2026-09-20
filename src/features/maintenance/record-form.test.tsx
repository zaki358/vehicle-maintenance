import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RecordForm } from './record-form'
import type { RecordFormResult } from './record-form'
import type { CompleteShakenInput } from '@/features/shaken/lib/complete-shaken-schema'
import type { DateString } from '@/lib/date/date-string'

describe('RecordForm', () => {
  it('未入力の実施日で送信するとエラーを表示しonSubmitを呼ばない', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '日付は YYYY-MM-DD 形式で、実在する日付を指定してください',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('エンジンオイルでは油種とエレメント交換の有無を入力できる', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.type(screen.getByLabelText('油種'), '0W-20')
    await user.click(screen.getByLabelText('オイルエレメントも交換した'))
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ workType: 'engine_oil', oilType: '0W-20', elementChanged: true }),
      )
    })
  })

  it('部品交換を選ぶと交換内容と部品型式が必須になる', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'part')

    expect(screen.getByLabelText('交換内容')).toBeInTheDocument()
    expect(screen.getByLabelText('部品型式')).toBeInTheDocument()
    expect(screen.queryByLabelText('油種')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('交換内容を入力してください')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('調整では部品型式の欄を出さない', async () => {
    const user = userEvent.setup()
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('作業内容'), 'adjust')

    expect(screen.getByLabelText('調整内容')).toBeInTheDocument()
    expect(screen.queryByLabelText('部品型式')).not.toBeInTheDocument()
  })

  it('油脂類交換では交換箇所と油種を入力できる', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.selectOptions(screen.getByLabelText('作業内容'), 'fluid')
    await user.type(screen.getByLabelText('交換箇所'), 'ミッション')
    await user.type(screen.getByLabelText('油種'), '75W-90')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ workType: 'fluid', detail: 'ミッション', oilType: '75W-90' }),
      )
    })
  })

  it('走行距離を未入力で送信すると null として渡す', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ odometerKm: null }))
    })
  })

  it('走行距離が既存記録と前後関係が逆になっていると警告を表示する（送信はブロックしない）', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={[]}
        existingReadings={[{ performedOn: '2026-08-01' as DateString, odometerKm: 15000 }]}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.type(screen.getByLabelText('走行距離'), '14000')

    expect(await screen.findByRole('status')).toHaveTextContent('走行距離が他の記録と前後関係が逆になっています')

    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  it('部品型式にサジェスト候補を表示する', async () => {
    const user = userEvent.setup()
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={['ZC33S-001', 'H4 LEDバルブ']}
        existingReadings={[]}
        onSubmit={vi.fn()}
      />,
    )

    await user.selectOptions(screen.getByLabelText('作業内容'), 'part')

    const input = screen.getByLabelText('部品型式')
    const listId = input.getAttribute('list')
    expect(listId).toBeTruthy()
    const datalist = document.getElementById(listId as string)
    expect(datalist?.querySelectorAll('option')).toHaveLength(2)
  })

  it('onSubmit がエラーを返したらそのメッセージを表示する', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: '保存に失敗しました' })
    render(<RecordForm submitLabel="登録" partSuggestionsList={[]} existingReadings={[]} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('実施日'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('保存に失敗しました')
  })

  it('初期値があれば各項目に反映する', () => {
    render(
      <RecordForm
        submitLabel="更新"
        initialValues={{
          performedOn: '2026-09-01' as DateString,
          workType: 'part',
          detail: 'ブレーキパッド',
          odometerKm: 12345,
          partDetail: 'ZC33S-001',
          oilType: '',
          elementChanged: false,
          note: 'メモ',
        }}
        partSuggestionsList={[]}
        existingReadings={[]}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('実施日')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('作業内容')).toHaveValue('part')
    expect(screen.getByLabelText('交換内容')).toHaveValue('ブレーキパッド')
    expect(screen.getByLabelText('走行距離')).toHaveValue(12345)
    expect(screen.getByLabelText('部品型式')).toHaveValue('ZC33S-001')
    expect(screen.getByLabelText('備考')).toHaveValue('メモ')
  })
})

describe('RecordForm（車検）', () => {
  const shakenRenewal = (onSubmit: (input: CompleteShakenInput) => Promise<RecordFormResult>) => ({
    currentExpiry: '2026-09-20' as DateString,
    onSubmit,
  })

  it('車検を選ぶと日付欄の見出しが車検日になり、満了日の欄が出る', async () => {
    const user = userEvent.setup()
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={[]}
        existingReadings={[]}
        shakenRenewal={shakenRenewal(vi.fn())}
        onSubmit={vi.fn()}
      />,
    )

    await user.selectOptions(screen.getByLabelText('作業内容'), 'shaken')

    expect(screen.getByLabelText('車検日')).toBeInTheDocument()
    expect(screen.getByLabelText('有効期間')).toBeInTheDocument()
    expect(screen.getByLabelText('新しい満了日')).toBeInTheDocument()
    expect(screen.queryByLabelText('部品型式')).not.toBeInTheDocument()
  })

  it('initialWorkType を渡すとその区分を選んだ状態で開く', () => {
    render(
      <RecordForm
        submitLabel="登録"
        initialWorkType="shaken"
        partSuggestionsList={[]}
        existingReadings={[]}
        shakenRenewal={shakenRenewal(vi.fn())}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('作業内容')).toHaveValue('shaken')
    expect(screen.getByLabelText('新しい満了日')).toBeInTheDocument()
  })

  it('車検日を入れると新しい満了日が制度どおりに自動計算される（繰り越し）', async () => {
    const user = userEvent.setup()
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={[]}
        existingReadings={[]}
        shakenRenewal={shakenRenewal(vi.fn())}
        onSubmit={vi.fn()}
      />,
    )

    await user.selectOptions(screen.getByLabelText('作業内容'), 'shaken')
    // 満了日(2026-09-20)の1ヶ月前以内の受検 → 旧満了日から2年
    await user.type(screen.getByLabelText('車検日'), '2026-09-01')

    expect(screen.getByLabelText('新しい満了日')).toHaveValue('2028-09-20')
  })

  it('車検の送信は満了日の更新へ回し、通常の記録としては送らない', async () => {
    const user = userEvent.setup()
    const onShakenSubmit = vi.fn().mockResolvedValue({ success: true })
    const onSubmit = vi.fn()
    render(
      <RecordForm
        submitLabel="登録"
        partSuggestionsList={[]}
        existingReadings={[]}
        shakenRenewal={shakenRenewal(onShakenSubmit)}
        onSubmit={onSubmit}
      />,
    )

    await user.selectOptions(screen.getByLabelText('作業内容'), 'shaken')
    await user.type(screen.getByLabelText('車検日'), '2026-09-01')
    await user.type(screen.getByLabelText('走行距離'), '52000')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onShakenSubmit).toHaveBeenCalledWith({
        performedOn: '2026-09-01',
        newExpiryDate: '2028-09-20',
        odometerKm: 52000,
        note: '',
      })
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('編集時（満了日の更新を伴わない）は車検でも満了日の欄を出さない', async () => {
    const user = userEvent.setup()
    render(<RecordForm submitLabel="更新" partSuggestionsList={[]} existingReadings={[]} onSubmit={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('作業内容'), 'shaken')

    expect(screen.getByLabelText('車検日')).toBeInTheDocument()
    expect(screen.queryByLabelText('新しい満了日')).not.toBeInTheDocument()
  })
})
