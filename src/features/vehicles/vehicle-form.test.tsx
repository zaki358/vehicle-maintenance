import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { VehicleForm } from './vehicle-form'

describe('VehicleForm', () => {
  it('未入力の車種名で送信するとエラーを表示しonSubmitを呼ばない', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<VehicleForm submitLabel="登録" onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('車種名を入力してください')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('車検満了日を未入力で送信すると null として渡す', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<VehicleForm submitLabel="登録" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('車種名'), 'カブ')
    await user.selectOptions(screen.getByLabelText('車両区分'), 'motorcycle')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'カブ',
        vehicleType: 'motorcycle',
        shakenExpiryDate: null,
        note: '',
      })
    })
  })

  it('車検満了日を入力して送信するとそのまま渡す', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: true })
    render(<VehicleForm submitLabel="登録" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('車種名'), 'ロードスター')
    await user.type(screen.getByLabelText('車検満了日（任意）'), '2027-05-01')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'ロードスター',
        vehicleType: 'car',
        shakenExpiryDate: '2027-05-01',
        note: '',
      })
    })
  })

  it('onSubmit がエラーを返したらそのメッセージを表示する', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: '保存に失敗しました' })
    render(<VehicleForm submitLabel="登録" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('車種名'), 'カブ')
    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('保存に失敗しました')
  })

  it('初期値があれば各項目に反映する', () => {
    render(
      <VehicleForm
        submitLabel="更新"
        initialValues={{ name: 'カブ', vehicleType: 'motorcycle', shakenExpiryDate: null, note: 'メモ' }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('車種名')).toHaveValue('カブ')
    expect(screen.getByLabelText('車両区分')).toHaveValue('motorcycle')
    expect(screen.getByLabelText('備考')).toHaveValue('メモ')
  })
})
