# create.ts

`src/features/vehicles/server/create.ts`

## 概要

車両を新規作成するサーバー関数です。`routes/_authed.vehicles.new.tsx` の登録フォームから呼ばれます。フォーム入力（キャメルケース）をDBの列名（スネークケース）へ詰め替える変換もこのファイルの責務です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `createVehicleHandler` | async function（export） | DBへのinsertの実処理 |
| `createVehicleFn` | const（export） | `vehicleSchema` で検証したうえで呼ぶ、実際のサーバー関数 |

## コード解説

```ts
export async function createVehicleHandler(input: VehicleInput, deps: CreateVehicleDeps): Promise<VehicleRow> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .insert({
      name: input.name,
      vehicle_type: input.vehicleType,
      shaken_expiry_date: input.shakenExpiryDate,
      note: input.note,
    })
    .select()
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`insert` するオブジェクトに `user_id` を含めていないのが意図的な設計です。`vehicles.user_id` はマイグレーションで `default auth.uid()` になっているため、クライアントが `user_id` を指定できる余地そのものを無くしています（もし指定できてしまうと、他人の `user_id` を詐称してなりすまし登録される脆弱性になり得ます）。`.insert(...).select().single()` は「挿入した行をそのまま返す」ためのPostgRESTの定番の書き方です。

```ts
export const createVehicleFn = createServerFn({ method: 'POST' })
  .validator(vehicleSchema)
  .handler(({ data }) => createVehicleHandler(data, { supabase: createSupabaseServerClient() }))
```

「全書き込みはサーバー関数の入口で Zod 検証する」というプロジェクト方針どおり、フォームの生入力を `vehicleSchema` （`vehicle-schema.ts`）でもう一度検証してから DB に渡します。クライアント側の検証（`vehicle-form.tsx`）はUXのためであり、ここでの検証が実際のセキュリティ境界です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/server/create.ts*
