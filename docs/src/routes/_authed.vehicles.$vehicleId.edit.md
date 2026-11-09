# \_authed.vehicles.$vehicleId.edit.tsx

`src/routes/_authed.vehicles.$vehicleId.edit.tsx`

## 概要

車両の編集ページです（URL: `/vehicles/$vehicleId/edit`）。親レイアウトから受け取った現在の車両情報を `VehicleForm` の `initialValues` として渡し、送信されたら `updateVehicleFn` を呼んで詳細ページへ戻ります。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | 編集ページのルート定義 |
| `EditVehiclePage` | function（component） | 初期値の組み立てと更新処理 |

## コード解説

```ts
const initialValues: VehicleInput = {
  name: vehicle.name,
  vehicleType: vehicle.vehicle_type as VehicleType,
  shakenExpiryDate: vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null,
  note: vehicle.note,
}
```

DB の行（`vehicle_type` が生の `string`、 `shaken_expiry_date` が生の `string | null`）から、 `VehicleForm` が期待する検証済みの型 `VehicleInput` （`VehicleType` と `DateString | null`）へ変換します。 `toDateString` は不正な値なら例外を投げるため、自分で書き込んだはずのデータが壊れている場合に気づけます（一覧ページの `as VehicleType` と同じく、自テーブルからの読み取りであることを前提にした変換です）。

```ts
async function handleSubmit(input: VehicleInput): Promise<VehicleFormResult> {
  try {
    const updated = await updateVehicleFn({ data: { id: vehicle.id, ...input } })
    if (!updated) {
      return { success: false, error: '更新に失敗しました。車両が見つかりませんでした。' }
    }
    await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
    return { success: true }
  } catch {
    return { success: false, error: '更新に失敗しました。時間をおいて再度お試しください。' }
  }
}
```

`new.tsx` の `handleSubmit` とほぼ同じ形ですが、更新対象を特定するために `id: vehicle.id` を入力に加えて `updateVehicleFn`（`updateVehicleSchema` で `id` を含めて検証する）に渡す点が異なります。成功したら新規登録と同じく、対象の車両の詳細ページへ戻ります。

**Phase 8のコードレビューで、`updateVehicleFn` が返す `null`（`vehicles/server/update.ts` のコメントどおり、「存在しない・他人の車両」を区別せず `null` を返す設計）をここで一切見ていないことが指摘され、修正しました。** 修正前は `null` が返っても素通しで `navigate` してしまい、実際には更新されていないのに「更新に成功した」という画面遷移になっていました。`if (!updated)` で明示的に失敗扱いにすることで、この食い違いを防いでいます。

---

*生成日: 2026-09-19（Phase 8でnull戻り値のチェックを追加） ／ 対象ファイル: src/routes/\_authed.vehicles.$vehicleId.edit.tsx*
