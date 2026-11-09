# update.ts

`src/features/vehicles/server/update.ts`

## 概要

車両を更新するサーバー関数です。`routes/_authed.vehicles.$vehicleId.edit.tsx` の編集フォームから呼ばれます。`vehicleIdSchema`（どの車両か）と `vehicleSchema`（何に変えるか）を合成した専用のスキーマで入力全体を検証します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `updateVehicleSchema` | const | `vehicleIdSchema` と `vehicleSchema` を合成した検証スキーマ |
| `UpdateVehicleInput` | type（export） | `updateVehicleSchema` から推論した入力の型 |
| `updateVehicleHandler` | async function（export） | DBへのupdateの実処理 |
| `updateVehicleFn` | const（export） | 実際に呼ぶサーバー関数 |

## コード解説

```ts
const updateVehicleSchema = vehicleIdSchema.extend(vehicleSchema.shape)
```

Zod の `.extend()` で2つの既存スキーマの項目をまとめています。「どの行を」（`id`）と「何に変えるか」（`vehicleSchema` の4項目）を1つのスキーマに合成することで、更新に必要な入力全体を一箇所で検証できます。

```ts
export async function updateVehicleHandler(
  input: UpdateVehicleInput,
  deps: UpdateVehicleDeps,
): Promise<VehicleRow | null> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .update({
      name: input.name,
      vehicle_type: input.vehicleType,
      shaken_expiry_date: input.shakenExpiryDate,
      note: input.note,
    })
    .eq('id', input.id)
    .select()
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`get.ts` と同じ理由で `.maybeSingle()` を使い、「存在しない・他人の車両」を `null` として返しています（`vehicles_update_own` ポリシーの `USING` 句が他人の行を対象から除外するため、0件で返ってくる）。 `id` 自体は更新対象に含めていません（更新後もキーは変わらない）。

```ts
export const updateVehicleFn = createServerFn({ method: 'POST' })
  .validator(updateVehicleSchema)
  .handler(({ data }) => updateVehicleHandler(data, { supabase: createSupabaseServerClient() }))
```

他のサーバー関数と同じ構造です。`createSupabaseServerClient()` の呼び出しは `.handler()` の中だけに置いています。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/server/update.ts*
