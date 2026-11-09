# get.ts

`src/features/vehicles/server/get.ts`

## 概要

車両を1件だけ取得するサーバー関数です。車両詳細・編集ページの土台になる `routes/_authed.vehicles.$vehicleId.tsx`（レイアウトルート）の `beforeLoad` から呼ばれ、取得した車両を子ルート（詳細・編集）へ route context として引き渡します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `getVehicleHandler` | async function（export） | DB問い合わせの実処理 |
| `getVehicleFn` | const（export） | `createServerFn` でラップし、`vehicleIdSchema` で入力を検証する関数 |

## コード解説

```ts
export async function getVehicleHandler(input: VehicleIdInput, deps: GetVehicleDeps): Promise<VehicleRow | null> {
  const { data, error } = await deps.supabase.from('vehicles').select('*').eq('id', input.id).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`.single()` ではなく `.maybeSingle()` を使うのが要点です。 `.single()` は該当行が0件だとエラーを投げますが、このアプリでは「存在しない ID」と「他人の車両（RLS が0件に絞り込んだ）」のどちらもエラーではなく `null` として扱いたいため、`.maybeSingle()` （0件なら `data: null, error: null`）を選んでいます。両者を区別してエラーメッセージを出し分けてしまうと、「この ID は誰かが使っている」という情報が他人に漏れます。

```ts
export const getVehicleFn = createServerFn({ method: 'GET' })
  .validator(vehicleIdSchema)
  .handler(({ data }) => getVehicleHandler(data, { supabase: createSupabaseServerClient() }))
```

`.validator(vehicleIdSchema)` により、ルートパラメータ由来の文字列が UUID の形をしているかをハンドラ本体に渡す前に確認します。 `list.ts`・`get-session.ts` と同じく、 `createSupabaseServerClient()` の呼び出しは `.handler()` の中に閉じ込めています。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/server/get.ts*
