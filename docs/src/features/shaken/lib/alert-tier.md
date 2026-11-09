# alert-tier.ts

`src/features/shaken/lib/alert-tier.ts`

## 概要

このアプリの**要件の中核**である「車検満了日の2ヶ月前・1ヶ月前になったら知らせる」をそのまま実装したファイルです。満了日と今日の2つの日付から、画面に出すべき警告の強さ（4段階）を1つ判定します。

要件は「2ヶ月前」「1ヶ月前」という**カレンダー上の月**を指しており、「60日前」「30日前」のような日数の近似ではありません。31日ある月をまたぐ満了日では日数近似だと1日ずれてしまうため、このファイルは月の加算（`addMonths`）を使って「暦月」で正確に判定します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `ShakenAlertTier` | type（export） | 4段階の警告レベル: none/warning/danger/expired |
| `shakenAlertTier` | function（export） | 満了日と今日から警告レベルを判定する |

## コード解説

```ts
export type ShakenAlertTier = 'none' | 'warning' | 'danger' | 'expired'
```

4つの状態を文字列リテラル型で表します。`none`（不要）、 `warning`（残り2ヶ月以内・注意）、`danger`（残り1ヶ月以内・警告）、 `expired`（期限切れ）の4段階です。

```ts
export function shakenAlertTier(expiry: DateString | null, today: DateString): ShakenAlertTier {
  if (expiry === null) {
    return 'none'
  }

  if (today > expiry) {
    return 'expired'
  }

  if (isOnOrAfter(today, addMonths(expiry, -1))) {
    return 'danger'
  }

  if (isOnOrAfter(today, addMonths(expiry, -2))) {
    return 'warning'
  }

  return 'none'
}
```

判定は上から順に、範囲の広いものから狭いものへと絞り込んでいきます。

**1. `expiry === null`** — 250cc以下のバイクなど、そもそも車検が無い車両。常に `none`。

**2. `today > expiry`** — 満了日を過ぎている。ここで `>`（同日を含まない）を使っているのが重要です。満了日**当日**は「まだ期限切れではない」と扱いたいため、 `today > expiry` は満了日当日には成立せず、次の `danger` 判定に進みます。

**3. `isOnOrAfter(today, addMonths(expiry, -1))`** — 「今日が『満了日の1ヶ月前』以降か」。`addMonths(expiry, -1)` で満了日ちょうど1ヶ月前の日付を求め、今日がそこに達していれば `danger` です。`isOnOrAfter` は同日を含むので、 1ヶ月前ちょうどの日も `danger` に入ります。

**4. `isOnOrAfter(today, addMonths(expiry, -2))`** — 同じ考え方で2ヶ月前かどうかを判定します。3番目の判定を通過しなかった（＝1ヶ月前にはまだ達していない）ことが分かっている状態でこの判定に来るので、ここが真なら「2ヶ月前は過ぎたが1ヶ月前はまだ」＝ `warning` と確定します。

**5. どれにも該当しなければ** `none`。まだ2ヶ月前にも達していない、十分先の満了日です。

月末が満了日のケース（例: 1月31日）では、2ヶ月前を計算すると 11月に31日が存在しないため `addMonths` が自動的に11月30日に丸めます（詳細は `add-months.ts` 参照）。この関数はその丸め済みの日付をそのまま使うので、月末満了日でも特別な分岐なく正しく動作します。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/shaken/lib/alert-tier.ts*
