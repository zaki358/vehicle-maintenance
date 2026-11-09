# filter-records.ts

`src/features/maintenance/lib/filter-records.ts`

## 概要

整備記録の一覧を、車両・作業内容・実施日の範囲で絞り込むための純粋関数です。画面の「作業内容フィルタ」機能の中核ロジックを、UI やデータ取得から切り離してテストできるようにしています。

指定しなかった条件は「絞り込まない」として扱われるため、条件を何も渡さなければ全件がそのまま返ります。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `RecordFilter` | type（export） | 絞り込み条件。各キーは省略可能 |
| `filterRecords` | function（export） | 条件に合う記録だけを新しい配列として返す |

## コード解説

```ts
export type RecordFilter = {
  vehicleId?: string
  workType?: string
  from?: DateString
  to?: DateString
}

type FilterableRecord = {
  vehicleId: string
  workType: string
  performedOn: DateString
}
```

`RecordFilter` の各フィールドはすべて省略可能（`?`）です。「値が無い＝その条件では絞り込まない」という設計にすることで、呼び出し側は使いたい条件だけを渡せます。

`FilterableRecord` は、この関数が実際に必要とする最小限の形です。整備記録の完全なデータ型（DB から取得する行の型）に依存せず、「絞り込みに必要な3つのフィールドさえあれば動く」ようにするための構造的な型で、次の `filterRecords` のジェネリクスの制約として使います。

```ts
export function filterRecords<T extends FilterableRecord>(records: readonly T[], filter: RecordFilter): T[] {
  return records.filter((record) => {
    if (filter.vehicleId !== undefined && record.vehicleId !== filter.vehicleId) {
      return false
    }
    if (filter.workType !== undefined && record.workType !== filter.workType) {
      return false
    }
    if (filter.from !== undefined && !isOnOrAfter(record.performedOn, filter.from)) {
      return false
    }
    if (filter.to !== undefined && !isOnOrBefore(record.performedOn, filter.to)) {
      return false
    }
    return true
  })
}
```

ジェネリクス `<T extends FilterableRecord>` により、 `vehicleId` / `workType` / `performedOn` 以外に任意のフィールド（`id`、`note` など）を持つ実際の記録の型をそのまま渡しても、戻り値の型情報が失われません。

4つの条件はすべて「指定されていれば、それに合わないものを除外する」という早期リターンの積み重ねです。`filter.vehicleId !== undefined` のチェックが「その条件を使うかどうか」の判定を兼ねています。

日付範囲の判定には `date-string.ts` の `isOnOrAfter` / `isOnOrBefore` を使っており、どちらも境界の日（`from` 当日・`to` 当日）を範囲に含みます。

`Array.prototype.filter` は新しい配列を返すため、引数の `records` を書き換えることはありません（不変性の維持）。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/maintenance/lib/filter-records.ts*
