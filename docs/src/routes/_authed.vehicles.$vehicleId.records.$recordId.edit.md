# \_authed.vehicles.$vehicleId.records.$recordId.edit.tsx

`src/routes/_authed.vehicles.$vehicleId.records.$recordId.edit.tsx`

## 概要

整備記録の編集ページです（URL: `/vehicles/$vehicleId/records/$recordId/edit`）。対象の記録を `loader` で特定し、見つからなければ `_authed.vehicles.$vehicleId.tsx`（車両詳細）と同じ考え方で `notFound()` を返します。

実装プランに列挙されたサーバー関数は `list/create/update/delete/ list-part-details` の5本で、記録1件だけを取得する専用関数（`get.ts` 相当）は含まれていません。このページは代わりに車両スコープの一覧（`listRecordsFn`）を取得し、対象IDをこのファイル内で絞り込みます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | 編集ページのルート定義。対象記録が見つからなければ `notFound()` |
| `RecordNotFound` | function（component） | 記録が見つからない場合の専用画面 |
| `EditRecordPage` | function（component） | フォーム表示と更新処理 |

## コード解説

```ts
loader: async ({ params }) => {
  const [records, partDetails] = await Promise.all([
    listRecordsFn({ data: { vehicleId: params.vehicleId } }),
    listPartDetailsFn({ data: { vehicleId: params.vehicleId } }),
  ])
  const record = records.find((candidate) => candidate.id === params.recordId)
  if (!record) {
    throw notFound()
  }
  return { record, records, partDetails }
}
```

`listRecordsFn` は指定した `vehicleId`（かつRLSにより自分の車両）の記録しか返さないため、「他の車両の記録ID」や「他人の記録ID」を `$recordId` に直接指定してURLへ来ても、一覧の中に見つからず自然に `notFound()` になります。存在しないIDと閲覧権限がないIDを区別しないのは、車両詳細ページの `_authed.vehicles.$vehicleId.tsx` と同じ設計判断です。

```ts
const initialValues: RecordInput = {
  performedOn: toDateString(record.performed_on),
  workType: record.work_type as WorkType,
  workTypeOther: record.work_type_other,
  odometerKm: record.odometer_km,
  partDetail: record.part_detail,
  note: record.note,
}
```

DB の行（スネークケース）から `RecordForm` が要求する `RecordInput`（キャメルケース）へ変換します。 `work_type` は DB 上ただの `string` 型ですが、実際の値は必ず `WORK_TYPES` のいずれかである保証（DBのCHECK制約）があるため `as WorkType` でキャストしています（`vehicles/$vehicleId/edit.tsx` の `vehicle_type` と同じ扱い）。

```ts
const existingReadings: OdometerReading[] = records
  .filter((candidate) => candidate.id !== record.id && candidate.odometer_km !== null)
  .map((candidate) => ({
    performedOn: toDateString(candidate.performed_on),
    odometerKm: candidate.odometer_km as number,
  }))
```

新規登録ページとの違いはここです。編集中の記録自身（`candidate.id !== record.id`）を比較対象から除外しないと、「自分自身と比較して走行距離が一致している」ことをもって矛盾なしと誤判定したり、値を変更した瞬間に自分自身との差分で誤って逆行警告が出たりします。

```ts
async function handleSubmit(input: RecordInput): Promise<RecordFormResult> {
  try {
    const updated = await updateRecordFn({ data: { id: record.id, record: input } })
    if (!updated) {
      return { success: false, error: '更新に失敗しました。整備記録が見つかりませんでした。' }
    }
    await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
    return { success: true }
  } catch {
    return { success: false, error: '更新に失敗しました。時間をおいて再度お試しください。' }
  }
}
```

**Phase 8のコードレビューで、`updateRecordFn` が返す `null`（`maintenance/server/update.ts` の設計どおり、「存在しない・他人の記録」を区別せず `null` を返す）をここで無視していたことが指摘され、`vehicles/$vehicleId/edit.tsx` と同じ形で修正しました。** `null` が返ってきた場合は失敗として扱い、成功したときだけ車両詳細ページへ戻ります。

---

*生成日: 2026-09-19（Phase 8でnull戻り値のチェックを追加） ／ 対象ファイル: src/routes/\_authed.vehicles.$vehicleId.records.$recordId.edit.tsx*
