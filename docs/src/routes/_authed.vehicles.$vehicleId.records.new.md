# \_authed.vehicles.$vehicleId.records.new.tsx

`src/routes/_authed.vehicles.$vehicleId.records.new.tsx`

## 概要

整備記録の新規登録ページです（URL: `/vehicles/$vehicleId/records/new`）。 `RecordForm` を「登録」モードで表示し、部品/型式のサジェスト候補と走行距離の逆行チェック用データを、ページ表示前に取得しておきます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | 新規登録ページのルート定義。`loader`で記録一覧と部品候補を並行取得 |
| `NewRecordPage` | function（component） | フォーム表示と登録処理 |

## コード解説

```ts
loader: async ({ params }) => {
  const [records, partDetails] = await Promise.all([
    listRecordsFn({ data: { vehicleId: params.vehicleId } }),
    listPartDetailsFn({ data: { vehicleId: params.vehicleId } }),
  ])
  return { records, partDetails }
}
```

「走行距離の逆行チェック用に全記録が要る」ことと「部品/型式のサジェストが要る」ことは互いに独立したデータ取得なので、`Promise.all` で同時に投げてページ表示までの待ち時間を短くしています。どちらも同じ `vehicleId` スコープのクエリです。

```ts
const partSuggestionsList = partSuggestions(partDetails.map((row) => ({ partDetail: row.part_detail })))
const existingReadings: OdometerReading[] = records
  .filter((record) => record.odometer_km !== null)
  .map((record) => ({ performedOn: toDateString(record.performed_on), odometerKm: record.odometer_km as number }))
```

Phase 3 で作った2つの純粋関数（`part-suggestions.ts`・ `odometer.ts`）に、DBの生データを適切な形に変換してから渡します。 `existingReadings` は走行距離が記録されている行だけに絞り込みます（`odometer_km` が `null` の記録と比較しても「逆行しているか」を判定できないため）。新規登録なので、自分自身を除外する必要はありません（まだ存在しないため）。

```ts
async function handleSubmit(input: RecordInput): Promise<RecordFormResult> {
  try {
    await createRecordFn({ data: { vehicleId: vehicle.id, record: input } })
    await navigate({ to: '/vehicles/$vehicleId', params: { vehicleId: vehicle.id } })
    return { success: true }
  } catch {
    return { success: false, error: '登録に失敗しました。時間をおいて再度お試しください。' }
  }
}
```

`vehicles/new.tsx` と同じ形です。`RecordForm` が `recordSchema` で検証済みの `RecordInput` を渡してくるので、ここでは `vehicleId` を足して `createRecordFn` に渡すだけです。成功したら車両詳細ページ（整備記録一覧）へ戻ります。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/\_authed.vehicles.$vehicleId.records.new.tsx*
