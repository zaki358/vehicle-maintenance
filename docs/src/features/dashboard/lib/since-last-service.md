# since-last-service.ts

`src/features/dashboard/lib/since-last-service.ts`

## 概要

ある車両の整備記録一覧から、「直近の整備がいつだったか」「そこから何日経っているか」を求める純粋関数です。ダッシュボードで「最終整備から 97日経過」のような表示をするための土台になります。

「直近」の判定は実施日（`performedOn`）の最大値で行うため、呼び出し側があらかじめ日付順に並べておく必要はありません。作業内容（オイル交換かタイヤ交換かなど）による絞り込みは行わず、渡された記録全体から最新の1件を見るだけです。作業内容ごとの「最終○○」が必要なら、呼び出し側で `filter-records.ts` の `workType` 条件で先に絞り込んでから渡す設計です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `LastServiceInfo` | type（export） | 直近整備の実施日と、今日までの経過日数 |
| `sinceLastService` | function（export） | 記録一覧から直近整備の情報を求める |

## コード解説

```ts
export type LastServiceInfo = {
  lastPerformedOn: DateString
  daysSince: number
}

type ServiceRecord = {
  performedOn: DateString
}
```

`ServiceRecord` は「実施日さえ持っていればよい」という最小限の構造型です。整備記録の完全な型に依存しないことで、呼び出し側は実際の記録オブジェクト（作業内容や部品情報などを含む、より大きな型）をそのまま渡せます。

```ts
export function sinceLastService<T extends ServiceRecord>(
  records: readonly T[],
  today: DateString,
): LastServiceInfo | null {
  if (records.length === 0) {
    return null
  }

  const lastPerformedOn = records.reduce<DateString>(
    (latest, record) => (record.performedOn > latest ? record.performedOn : latest),
    records[0].performedOn,
  )

  return {
    lastPerformedOn,
    daysSince: daysBetween(lastPerformedOn, today),
  }
}
```

**記録が0件の場合** — 車両を登録したばかりでまだ整備記録が無いケースを表すため、`null` を返します。呼び出し側は「まだ記録がありません」のような表示に分岐できます。

**最新の実施日を求める** — `reduce` で `records` を1件ずつ見ながら、それまでの最大値（`latest`）より新しければ更新していきます。 `DateString` はゼロ埋めされた `YYYY-MM-DD` 形式（`date-string.ts` 参照）なので、文字列の `>` 比較がそのまま日付の新旧比較になり、`Date` への変換は不要です。

**経過日数の算出** — 見つかった最新の実施日と `today` の差を `date-string.ts` の `daysBetween` に委譲します。日数計算のロジックをこのファイルに重複させないためです。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/dashboard/lib/since-last-service.ts*
