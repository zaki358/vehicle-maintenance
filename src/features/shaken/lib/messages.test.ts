import { describe, expect, it } from 'vitest'

import { shakenTierMessage } from './messages'

describe('shakenTierMessage', () => {
  it('none は空文字（何も表示しない）', () => {
    expect(shakenTierMessage('none', 100)).toBe('')
  })

  it('warning は残り日数を含む注意メッセージ', () => {
    expect(shakenTierMessage('warning', 45)).toBe('車検まであと45日です。そろそろ予約をご検討ください。')
  })

  it('danger は残り日数を含む強い警告メッセージ', () => {
    expect(shakenTierMessage('danger', 12)).toBe('車検まであと12日です。お早めに受検してください。')
  })

  it('danger の残り0日は「本日が満了日」の特別な文言になる', () => {
    expect(shakenTierMessage('danger', 0)).toBe('本日が車検満了日です。至急受検してください。')
  })

  it('expired は超過日数を含む文言（daysRemaining は負の数で渡される）', () => {
    expect(shakenTierMessage('expired', -5)).toBe('車検が5日超過しています。至急受検してください。')
  })

  it('daysRemaining が null（満了日未設定）でも warning/danger/expired にはならない前提だが、\n' +
     '  none の場合は日数を使わないので null を渡しても安全', () => {
    expect(shakenTierMessage('none', null)).toBe('')
  })

  it('expired に null が渡っても例外にならない防御（型上あり得るが実際には発生しない想定）', () => {
    expect(shakenTierMessage('expired', null)).toBe('車検が0日超過しています。至急受検してください。')
  })
})
