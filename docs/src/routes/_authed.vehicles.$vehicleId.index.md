# \_authed.vehicles.$vehicleId.index.tsx

`src/routes/_authed.vehicles.$vehicleId.index.tsx`

## 概要

車両の詳細ページです（URL: `/vehicles/$vehicleId`）。車両情報（区分・車検満了日・備考）の表示と編集・削除に加え、 Phase 6 でこのページに\*\*整備記録の一覧\*\*を統合しました。作業内容での絞り込み、記録ごとの編集リンクと削除ボタンを持ちます。

整備記録の追加は専用ページ（`records/new`）に分けていますが、一覧・フィルタ・削除はこの詳細ページ自身が担当します。車両1台のページに来れば、その車両の整備状況がすべて見える構成です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | 詳細ページのルート定義。`loader`で整備記録一覧を取得 |
| `toFilterable` | function | DBの行を `filter-records.ts`/`sort-records.ts` が使える形へ変換 |
| `VehicleDetailPage` | function（component） | 表示・車検アラート・車両削除・記録の絞り込みと削除 |

## コード解説

```ts
export const Route = createFileRoute('/_authed/vehicles/$vehicleId/')({
  loader: ({ params }) => listRecordsFn({ data: { vehicleId: params.vehicleId } }),
  component: VehicleDetailPage,
})
```

Phase 5 まではこのルートに `loader` がなく、親レイアウトが積んだ `vehicle` だけを表示していました。Phase 6 で整備記録一覧を表示するために `loader` を追加し、ページ表示前に `listRecordsFn` で該当車両の整備記録を取得します（TanStack Router のローダーはナビゲーション中に並行実行される）。

```ts
function toFilterable(row: MaintenanceRecordRow) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    workType: row.work_type as WorkType,
    workTypeOther: row.work_type_other,
    performedOn: toDateString(row.performed_on),
    odometerKm: row.odometer_km,
    partDetail: row.part_detail,
  }
}
```

DB の行はスネークケース（`work_type`・`performed_on`）ですが、 Phase 3 で作った純粋関数 `filterRecords`/`sortRecords` はキャメルケースの形を要求します。この変換はルート（UI層）の責務とし、 `lib/` 側には持ち込みません（`lib/` は Supabase の列名を一切知らない設計のため）。`toDateString` は `performed_on` が常に検証済みの `date` 列であることが前提で、不正な値が来ればここで例外になります。

```ts
const visibleRecords = useMemo(() => {
  const filterable = records.map(toFilterable)
  const filtered = filterRecords(filterable, {
    workType: workTypeFilter === 'all' ? undefined : workTypeFilter,
  })
  return sortRecords(filtered, 'newest')
}, [records, workTypeFilter])
```

絞り込み（作業内容）と並び替え（新しい順固定）は、どちらもPhase 3の純粋関数にそのまま委ねています。UI側が持つロジックは「どのフィルタ条件を選んだか」という状態だけです。`filterRecords` の `workType` は「未指定なら絞り込まない」設計のため、「すべて」を選んだときは `undefined` を渡します。

```ts
async function handleDeleteRecord(recordId: string) {
  const confirmed = window.confirm('この整備記録を削除します。よろしいですか？')
  if (!confirmed) {
    return
  }
  setDeletingRecordId(recordId)
  setDeleteRecordError(null)
  try {
    await deleteRecordFn({ data: { id: recordId } })
    await router.invalidate()
  } catch {
    setDeleteRecordError('削除に失敗しました。時間をおいて再度お試しください。')
  } finally {
    setDeletingRecordId(null)
  }
}
```

車両削除（`handleDeleteVehicle`）は削除後に一覧ページへ `navigate` しますが、整備記録の削除は同じページに留まって一覧だけを更新したいため、`useRouter().invalidate()` で `loader` を再実行させます。削除対象のIDを `deletingRecordId` に保持し、その行のボタンだけを `disabled` にすることで、複数行を誤って連打しても他の行の操作は妨げません。

**Phase 8のコードレビューで、`handleDeleteVehicle` とこの `handleDeleteRecord` の両方に `catch` が無く、削除失敗時にエラーが握りつぶされることが指摘され、修正しました。** それぞれ `deleteVehicleError`／`deleteRecordError` という専用の state を持ち、失敗時は `role="alert"` の段落でメッセージを表示します。

```ts
const shakenExpiryDate = vehicle.shaken_expiry_date ? toDateString(vehicle.shaken_expiry_date) : null
const shakenTier = shakenAlertTier(shakenExpiryDate, todayInJst())
const shakenMessage =
  shakenTier === 'none' ? null : shakenTierMessage(shakenTier, daysUntilExpiry(shakenExpiryDate, todayInJst()))
...
{shakenRequired(shakenExpiryDate) && (
  <section>
    {shakenMessage && <p role={shakenTier === 'warning' ? 'status' : 'alert'}>{shakenMessage}</p>}
    <p>
      <Link to="/vehicles/$vehicleId/shaken" params={{ vehicleId: vehicle.id }}>
        車検完了を記録
      </Link>
    </p>
  </section>
)}
```

Phase 7 で追加した車検アラート表示です。Phase 3 で完成済みの `shaken/lib`（`shakenAlertTier`・`shakenTierMessage`・ `days-remaining.ts`の`daysUntilExpiry`）と `vehicles/lib/shaken-required.ts`をそのまま組み合わせるだけで、このファイル自身は日付計算やアラート段階の判定ロジックを一切持ちません。

`shakenRequired(shakenExpiryDate)`（＝満了日が設定されているか）でセクション全体をガードしているのが要点です。E2E要件「250cc以下のバイク（満了日なし）に車検UIもアラートも一切出ないこと」を、車両区分では分岐せず満了日の有無だけで満たします。「車検完了を記録」へのリンクも同じガードの内側にあるため、車検を扱わない車両にはこのリンク自体が現れません。

---

*生成日: 2026-09-19（Phase 8で削除失敗時のエラー表示を追加） ／ 対象ファイル: src/routes/\_authed.vehicles.$vehicleId.index.tsx*
