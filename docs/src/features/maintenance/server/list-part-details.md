# list-part-details.ts

`src/features/maintenance/server/list-part-details.ts`

## 概要

整備記録フォームの「部品/型式」欄でサジェスト候補を出すために、指定した車両の `part_detail` 列だけを実施日の新しい順で取得するサーバー関数です。整備記録の全列を取得する `list.ts` とは別に用意しているのは、サジェストには不要な列（備考・走行距離など）まで転送する無駄を避けるためです。

重複除去や部分一致での絞り込みはここでは行いません。取得した生データを Phase 3 で作成済みの純粋関数 `maintenance/lib/part-suggestions.ts` に渡し、呼び出し側（フォームのあるルート）で行います。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `PartDetailRow` | type（export） | `maintenance_records` 行のうち `part_detail` 列だけを持つ型 |
| `ListPartDetailsDeps` | interface | ハンドラが必要とする Supabase クライアントの最小インターフェース |
| `listPartDetailsHandler` | async function（export） | 指定車両の `part_detail` 一覧を取得する純粋なハンドラ |
| `listPartDetailsFn` | const（export） | `createServerFn` でラップした実HTTPエンドポイント |

## コード解説

```ts
export type PartDetailRow = Pick<Tables<'maintenance_records'>, 'part_detail'>
```

`Tables<'maintenance_records'>`（全列の行型）から `part_detail` だけを `Pick` しています。 `.select('part_detail')` で実際に取得する列と型を一致させ、「取得していない列にアクセスできてしまう」ことを型で防いでいます。

```ts
export async function listPartDetailsHandler(
  input: VehicleScopeInput,
  deps: ListPartDetailsDeps,
): Promise<PartDetailRow[]> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .select('part_detail')
    .eq('vehicle_id', input.vehicleId)
    .order('performed_on', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`list.ts` とほぼ同じ形ですが、`select('*')` ではなく `select('part_detail')` にしている点だけが異なります。新しい順で返すのは、`part-suggestions.ts` が「配列の登場順を保つ」設計になっており、最近使った値ほどサジェストの先頭に出したいためです。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/server/list-part-details.ts*
