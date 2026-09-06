import type { ShakenAlertTier } from './alert-tier'

/**
 * 車検アラートの段階（`ShakenAlertTier`）に応じた日本語メッセージを組み立てる。
 *
 * `daysRemaining` は `daysUntilExpiry` の戻り値をそのまま渡す想定。
 * `expired` のときは負の数になるので、超過日数として表示する際に符号を反転する。
 *
 * `none` は画面上メッセージを表示しない段階なので `daysRemaining` を使わず、
 * `null`（満了日が無い車両）が渡されても安全に空文字を返す。
 */
export function shakenTierMessage(tier: ShakenAlertTier, daysRemaining: number | null): string {
  switch (tier) {
    case 'none':
      return ''

    case 'warning':
      return `車検まであと${daysRemaining}日です。そろそろ予約をご検討ください。`

    case 'danger':
      if (daysRemaining === 0) {
        return '本日が車検満了日です。至急受検してください。'
      }
      return `車検まであと${daysRemaining}日です。お早めに受検してください。`

    case 'expired': {
      const overdueDays = Math.abs(daysRemaining ?? 0)
      return `車検が${overdueDays}日超過しています。至急受検してください。`
    }
  }
}
