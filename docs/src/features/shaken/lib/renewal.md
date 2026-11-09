# renewal.ts

`src/features/shaken/lib/renewal.ts`

## 概要

車検を受けたときに、次の満了日をいくつに設定すべきかを計算するファイルです。「＋2年」「＋3年（新車初回）」を選ぶだけでなく、 **日本の車検制度に実在する「繰り越しルール」**まで正確に再現しています。

制度の要点: 満了日の1ヶ月前以内に受検すれば、新しい満了日は「受検日 ＋ N年」ではなく**「旧満了日 ＋ N年」**になります。これは早めに受検した人が損をしない（満了日が前倒しにならない）ための仕組みです。逆に1ヶ月より前に受検すると、この繰り越しは適用されず受検日を起点に数え直されます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `ShakenValidYears` | type（export） | 有効期間。2年 または 3年（新車初回）のみを許す |
| `SHAKEN_VALID_YEARS` | const（export） | `ShakenValidYears` の全値 `[2, 3]`。UIの選択肢を列挙するのに使う |
| `RenewalInput` | type（export） | 計算に必要な入力（受検日・旧満了日・有効期間） |
| `computeNextShakenExpiry` | function（export） | 新しい満了日を計算する |

## コード解説

```ts
export type ShakenValidYears = 2 | 3

export const SHAKEN_VALID_YEARS: readonly ShakenValidYears[] = [2, 3]
```

車検の有効期間は「2年」か「3年（新車初回）」の2択しかありません。 `number` ではなくこのリテラル型にすることで、誤って「5年」のような値を渡すコードを型検査の段階で弾けます。

`SHAKEN_VALID_YEARS` は Phase 7 で追加した配列定数です。車検完了フォーム（`complete-shaken-form.tsx`）の「有効期間」セレクトボックスを `.map()` で列挙するために使います。 `WORK_TYPES`（`maintenance/lib/work-types.ts`）と同じく、「型として許される値の集合」と「UIに列挙する値」を1箇所にまとめる狙いです。

```ts
export function computeNextShakenExpiry({ completedOn, currentExpiry, years }: RenewalInput): DateString {
  if (currentExpiry === null) {
    return addYears(completedOn, years)
  }

  const oneMonthBeforeExpiry = addMonths(currentExpiry, -1)
  const isWithinCarryForwardWindow =
    isOnOrAfter(completedOn, oneMonthBeforeExpiry) && isOnOrAfter(currentExpiry, completedOn)

  if (isWithinCarryForwardWindow) {
    return addYears(currentExpiry, years)
  }

  return addYears(completedOn, years)
}
```

**1. 新規登録（`currentExpiry === null`）。** 車両を初めて登録して車検情報を設定する場面では、繰り越す元の満了日が存在しません。単純に受検日から `years` 年後です。

**2. 繰り越しの判定窓（`isWithinCarryForwardWindow`）。** 「受検日が『旧満了日の1ヶ月前』以降、かつ『旧満了日』以前」という条件を、日付の両側から挟み込む形で表しています。

- `isOnOrAfter(completedOn, oneMonthBeforeExpiry)` — 早すぎる受検（1ヶ月より前）を除外する側
- `isOnOrAfter(currentExpiry, completedOn)` — 期限切れ後の受検を除外する側（＝受検日が旧満了日を超えていないこと）

両方を満たす窓の中でだけ、繰り越し（`addYears(currentExpiry, years)`）が適用されます。窓の外（早すぎるか、遅すぎるか）では、素直に `addYears(completedOn, years)` で受検日を起点に数え直します。

この「窓」という考え方にしたことで、早すぎるケースと期限切れケースを別々の条件分岐で書く必要がなくなり、テストケースも「窓の内側」「窓の外側（前後2方向）」というシンプルな3分類に対応させられます。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/shaken/lib/renewal.ts*
