# part-suggestions.ts

`src/features/maintenance/lib/part-suggestions.ts`

## 概要

整備記録の「部品/型式」欄は単一の自由入力欄ですが、過去に入力した値から候補を出すことで入力の手間を減らします。このファイルは、過去の記録一覧と現在の入力途中の文字列から、候補となる文字列の配列を作るだけの純粋関数です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `partSuggestions` | function（export） | 過去の部品/型式からサジェスト候補を作る |

## コード解説

```ts
export function partSuggestions<T extends PartDetailRecord>(records: readonly T[], query = ''): string[] {
  const trimmedQuery = query.trim()
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const record of records) {
    const detail = record.partDetail.trim()
    if (detail === '' || seen.has(detail)) {
      continue
    }
    if (trimmedQuery !== '' && !detail.includes(trimmedQuery)) {
      continue
    }
    seen.add(detail)
    suggestions.push(detail)
  }

  return suggestions
}
```

`records` を先頭から順に見ていき、条件を満たすものだけを `suggestions` に積んでいきます。

**重複除去** — `seen`（`Set`）に追加済みの値を記録し、2回目以降に同じ値が出てきてもスキップします。同じ部品を何度も使っていても候補には1回しか出ません。

**登場順を保つ** — 頻度順や五十音順に並べ替えるのではなく、渡された配列の順序をそのまま使います。呼び出し側が `sort-records.ts` で新しい順に並べた記録を渡せば、「直近使った値ほど候補の上に来る」という自然な挙動になります。並べ替えの責務をこの関数に持たせないことで、関数の役割を「絞り込みと重複除去」だけに保っています。

**空文字の除外** — `detail === ''`（前後の空白を trim した後）のものは候補にしません。未入力のまま保存された記録があっても空の候補が出ないようにするためです。

**`query` による絞り込み** — 空文字（既定値）なら絞り込まず全候補を返し、何か入力されていればその文字列を含むものだけに絞ります。前方一致ではなく部分一致（`String.includes`）にしているのは、型式の途中の文字列で検索したいケース（例:「10W-40」で検索してオイル銘柄を探す）を想定しているためです。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/maintenance/lib/part-suggestions.ts*
