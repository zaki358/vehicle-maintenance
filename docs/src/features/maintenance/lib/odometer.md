# odometer.ts

`src/features/maintenance/lib/odometer.ts`

## 概要

走行距離は時間とともにしか増えないはず、という前提のもとで、新しく入力しようとしている整備記録の走行距離が、その車両の既存の記録と矛盾していないか（＝「逆行」していないか）を判定します。入力ミスの検知に使う、整備記録フォームの警告表示の裏側のロジックです。

ここでの「矛盾」は単純な大小比較ではなく、**日付**と **走行距離**の2軸で見る必要があります。この関数はその判定だけを行い、実際に既存記録をどこから取得するか（DB・キャッシュなど）には関与しません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `OdometerReading` | type（export） | 実施日と走行距離のペア |
| `isOdometerRegression` | function（export） | 新しい入力が既存記録と矛盾（逆行）していないかを判定する |

## コード解説

```ts
export function isOdometerRegression(candidate: OdometerReading, otherRecords: readonly OdometerReading[]): boolean {
  return otherRecords.some((other) => {
    const otherIsEarlierOrSameDay = isOnOrBefore(other.performedOn, candidate.performedOn)
    if (otherIsEarlierOrSameDay && other.odometerKm > candidate.odometerKm) {
      return true
    }

    const otherIsLaterOrSameDay = isOnOrAfter(other.performedOn, candidate.performedOn)
    if (otherIsLaterOrSameDay && other.odometerKm < candidate.odometerKm) {
      return true
    }

    return false
  })
}
```

`candidate`（これから登録しようとしている記録）を、 `otherRecords`（同じ車両の既存記録。`candidate` 自身は呼び出し側であらかじめ除いておく想定）の1件ずつと比較し、矛盾する記録が1件でもあれば `true` を返します。

矛盾には2方向あります。

**1. `candidate` と同日以前の記録の方が走行距離が多い** — 例えば1月に10,000kmだった記録があるのに、6月の記録として9,000kmを入力しようとした場合。時間が進んでいるのに距離が減っているので矛盾です。

**2. `candidate` と同日以降の記録の方が走行距離が少ない** — 例えば9月に15,000kmの記録があるのに、6月の記録として20,000kmを後から追加しようとした場合。未来の記録の方が距離が少ないことになり、やはり矛盾です。

`isOnOrBefore` / `isOnOrAfter`（どちらも `date-string.ts` 由来）は同日を含むため、同じ日付の記録同士も両方の判定にかかります。これにより、同日に2件記録した場合でも走行距離の大小関係がチェックされます（例: 同日に9,000kmと10,000kmの記録が両方あれば、どちらの順で入力しても矛盾として検知されます）。

`Array.prototype.some` は最初に条件を満たした時点で `true` を返し、それ以上の記録を調べません（短絡評価）。既存記録が多い車両でも無駄な比較をしないための選択です。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/maintenance/lib/odometer.ts*
