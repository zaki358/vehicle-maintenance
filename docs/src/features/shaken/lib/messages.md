# messages.ts

`src/features/shaken/lib/messages.ts`

## 概要

`alert-tier.ts` が判定した4段階の警告レベルを、画面に表示する具体的な日本語の文章に変換するファイルです。「レベルの判定」と「文言」を別ファイルに分けることで、文言だけを直したいとき（言い回しの調整など）に判定ロジックを触らずに済みます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `shakenTierMessage` | function（export） | 警告レベルと残り日数から表示文言を組み立てる |

## コード解説

```ts
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
```

`tier`（4値のリテラル型）で分岐する `switch` です。すべての値を網羅しているため、TypeScript は分岐漏れがあればコンパイルエラーとして検出できます（将来 `ShakenAlertTier` に新しい状態が増えたときの安全網になります）。

**`danger` の中の特別扱い。** 残り日数が `0`（本日が満了日）のときだけ、「あと0日です」ではなく「本日が満了日です」という、人間が読んで自然な文言に切り替えています。数値をそのまま文章に埋め込むだけでは不自然になる箇所を手当てしています。

**`expired` の符号反転。** `daysUntilExpiry`（`days-remaining.ts`）は期限切れの場合に負の数（例: `-5`）を返す設計でした。利用者向けの文言では「5日超過」のように正の数で見せたいため、ここで `Math.abs` を使って符号を反転しています。

`daysRemaining ?? 0` は型の上で `null` を許容していることへの防御です。実際の呼び出し経路では `expired` のときに `daysRemaining` が `null` になることはありませんが（満了日が存在するからこそ期限切れと判定されるため）、型が許している以上は関数単体で見たときに安全であるべき、という考え方で入れています。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/shaken/lib/messages.ts*
