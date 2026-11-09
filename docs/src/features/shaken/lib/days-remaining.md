# days-remaining.ts

`src/features/shaken/lib/days-remaining.ts`

## 概要

車検満了日までの残り日数を1つだけ計算する、ごく小さなファイルです。車検の設定が無い車両（250cc以下のバイクなど）を `null` として正しく扱えることが、このファイルの存在意義です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `daysUntilExpiry` | function（export） | 満了日までの残り日数、または車検無しなら `null` |

## コード解説

```ts
export function daysUntilExpiry(expiry: DateString | null, today: DateString): number | null {
  if (expiry === null) {
    return null
  }
  return daysBetween(today, expiry)
}
```

`lib/date/date-string.ts` の `daysBetween` をそのまま呼んでいるだけの薄いラッパーですが、この薄さこそが意図です。`expiry` が `null` （250cc以下のバイクなど、そもそも車検の概念が無い車両）の場合を呼び出し元に強制的に意識させるため、専用の関数として切り出しています。

戻り値を `0` や `-1` のような「意味のある数値」ではなく `null` にしているのがポイントです。これにより、呼び出し側（`alert-tier.ts`）は「残り0日（本日満了）」と「そもそも車検が無い」を型のレベルで取り違えなくなります。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/shaken/lib/days-remaining.ts*
