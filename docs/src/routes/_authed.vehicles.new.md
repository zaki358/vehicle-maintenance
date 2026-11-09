# \_authed.vehicles.new.tsx

`src/routes/_authed.vehicles.new.tsx`

## 概要

車両の新規登録ページです（URL: `/vehicles/new`）。 `VehicleForm` コンポーネントに空欄のフォームを描画させ、送信されたら `createVehicleFn` を呼んで DB に保存し、作成された車両の詳細ページへ遷移します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/vehicles/new` ルートの定義 |
| `NewVehiclePage` | function（component） | フォームの表示と送信処理 |

## コード解説

```ts
async function handleSubmit(input: VehicleInput): Promise<VehicleFormResult> {
  try {
    const vehicle = await createVehicleFn({ data: input })
    await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
    return { success: true }
  } catch {
    return { success: false, error: '登録に失敗しました。時間をおいて再度お試しください。' }
  }
}
```

`VehicleForm` はこのルートが「新規登録」であることを知らず、検証済みの `VehicleInput` を `onSubmit` に渡すだけです。ここではその入力を `createVehicleFn` に渡し、成功したら新しく作られた車両の ID を使って詳細ページへ型安全に遷移します。失敗時は例外を握りつぶさず、フォームがエラーとして表示できる形（`{ success: false, error }`）に変換して返します。

```ts
<VehicleForm submitLabel="登録" onSubmit={handleSubmit} />
```

`initialValues` を渡していません。`VehicleForm` は `initialValues` が無ければ全項目を空欄から始めるため、これだけで新規登録フォームになります。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/\_authed.vehicles.new.tsx*
