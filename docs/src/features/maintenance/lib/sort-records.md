# sort-records.ts

`src/features/maintenance/lib/sort-records.ts`

## 概要

整備記録の一覧を実施日順に並べ替える関数です。デフォルトは新しい順（直近の整備が最初に来る、一覧表示で自然な並び）で、古い順への切り替えにも対応します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `RecordSortOrder` | type（export） | 並び順: `'newest'` または `'oldest'` |
| `sortRecords` | function（export） | 実施日で並べ替えた新しい配列を返す |

## コード解説

```ts
export function sortRecords<T extends SortableRecord>(
  records: readonly T[],
  order: RecordSortOrder = 'newest',
): T[] {
  const compareAsc = (a: T, b: T): number => {
    if (a.performedOn < b.performedOn) return -1
    if (a.performedOn > b.performedOn) return 1
    return 0
  }
  return [...records].sort(order === 'oldest' ? compareAsc : (a, b) => compareAsc(b, a))
}
```

`DateString` はゼロ埋めされた `YYYY-MM-DD` 形式であることが保証されているため（`date-string.ts` 参照）、`<` / `>` による文字列比較がそのまま日付の前後関係と一致します。 `Date` オブジェクトへの変換は不要です。

`compareAsc` は「昇順（古い順）」の比較関数です。等しい場合に `0` を返すことを明示しているのがポイントで、これが無いと同じ日付の記録同士の並びが安定しません（`Array.prototype.sort` は比較関数が一貫した結果を返すことを前提にしているため）。

新しい順（`'newest'`）が欲しいときは、`compareAsc(a, b)` ではなく引数を入れ替えた `compareAsc(b, a)` を渡しています。比較関数をもう1つ書く代わりに、既存の比較関数の引数を反転させるだけで逆順を作れるという典型的なテクニックです。

`[...records]` でコピーしてから `.sort()` しているのは、 `Array.prototype.sort` が破壊的（元の配列を書き換える）メソッドだからです。呼び出し元が渡した配列を書き換えない（不変性を保つ）ために必須の一手間です。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/maintenance/lib/sort-records.ts*
