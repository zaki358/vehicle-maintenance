# delete.ts

`src/features/vehicles/server/delete.ts`

## 概要

車両を削除するサーバー関数です。車両詳細ページの「削除」ボタンから呼ばれます。物理削除（DBから行そのものを消す）で、紐づく整備記録も一緒に消えます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `deleteVehicleHandler` | async function（export） | DBからのdeleteの実処理 |
| `deleteVehicleFn` | const（export） | 実際に呼ぶサーバー関数 |

## コード解説

```ts
export async function deleteVehicleHandler(input: VehicleIdInput, deps: DeleteVehicleDeps): Promise<void> {
  const { error } = await deps.supabase.from('vehicles').delete().eq('id', input.id)
  if (error) {
    throw new Error(error.message)
  }
}
```

削除前に「この車両は本当に自分のものか」を明示的に確認していません。 `maintenance_records` の `vehicle_id` 外部キーに `on delete cascade` が設定されているため、この1回の削除で紐づく整備記録もまとめて消えます。他人の・存在しない ID を指定しても `vehicles_delete_own` ポリシーが対象行を0件にするだけで、エラーにはならない「何も起きない」操作になります（副作用が無いので安全に no-op として扱えます）。

```ts
export const deleteVehicleFn = createServerFn({ method: 'POST' })
  .validator(vehicleIdSchema)
  .handler(({ data }) => deleteVehicleHandler(data, { supabase: createSupabaseServerClient() }))
```

`vehicleIdSchema` で `id` が UUID の形をしているかだけを確認してから削除を実行します。他のサーバー関数と同じ構造です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/server/delete.ts*
