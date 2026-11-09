# list.ts

`src/features/maintenance/server/list.ts`

## 概要

指定した車両の整備記録一覧を、実施日の新しい順で取得するサーバー関数です。車両詳細ページ（`_authed.vehicles.$vehicleId.index.tsx`）と整備記録の新規登録・編集ページの両方が、走行距離の逆行チェックや作業内容フィルタの元データとしてこれを呼びます。

Phase 5 の `vehicles/server/list.ts` と同じ設計方針を踏襲しています: `xxxHandler`（deps 注入・純粋・テスト容易）と、それを `createServerFn().handler()` で包む `xxxFn`（実HTTPエンドポイント）の2段構成です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `MaintenanceRecordRow` | type（export） | `maintenance_records` テーブルの行型（`database.types.ts` から） |
| `ListRecordsDeps` | interface | ハンドラが必要とする Supabase クライアントの最小インターフェース |
| `listRecordsHandler` | async function（export） | 指定車両の整備記録一覧をDBから取得する純粋なハンドラ |
| `listRecordsFn` | const（export） | `createServerFn` でラップした実HTTPエンドポイント |

## コード解説

```ts
export type MaintenanceRecordRow = Tables<'maintenance_records'>

interface ListRecordsDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}
```

戻り値の型は DB の行そのもの（スネークケース）です。`vehicles/server/list.ts` と同じく、キャメルケースへの変換はここでは行わず、呼び出し側（ルート）で必要な場面だけ個別に変換します。`deps.supabase` を `Pick<..., 'from'>` に絞っているのは、テストで `vi.fn()` の素のオブジェクトを型キャストなしで渡せるようにするためです。

```ts
export async function listRecordsHandler(
  input: VehicleScopeInput,
  deps: ListRecordsDeps,
): Promise<MaintenanceRecordRow[]> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', input.vehicleId)
    .order('performed_on', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`user_id` での絞り込みをこの関数側で書かないのは意図的です。 RLS の `maintenance_records_select_own` ポリシーが既に `auth.uid() = user_id` を強制しており、二重に書くと「ポリシーが正しく機能しているか」をアプリコードのフィルタが隠してしまいます（`vehicles/server/list.ts` と同じ考え方）。また、複合外部キー `(vehicle_id, user_id)` により `vehicle_id` は必ず自分の車両を指すため、`vehicleId` だけの絞り込みで他人の記録が混ざる余地はありません。並び順は「新しい順」を既定にし、一覧表示でそのまま使える形にしています。

```ts
export const listRecordsFn = createServerFn({ method: 'GET' })
  .validator(vehicleScopeSchema)
  .handler(({ data }) => listRecordsHandler(data, { supabase: createSupabaseServerClient() }))
```

`createSupabaseServerClient()` の呼び出しを `.handler()` コールバックの中だけに置いているのは、 Phase 4 で判明した「デフォルト引数にすると import-protection エラーでビルドが失敗する」問題を避けるためです（詳細は進捗記録の「判断の記録」参照）。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/server/list.ts*
