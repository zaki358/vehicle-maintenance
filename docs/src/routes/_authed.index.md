# \_authed.index.tsx

`src/routes/_authed.index.tsx`

## 概要

`_authed` レイアウトの「index」ルート、つまり URL `/` に対応するページです。ログインすると最終的に辿り着く、このアプリの本来のダッシュボードです（Phase 4〜6 の間はメールアドレス表示だけの仮ページでしたが、Phase 7 で本実装に置き換えました）。

登録済みの全車両を、車種名・現在の走行距離・前回整備日・車検アラートとともに一覧表示します。車検の残りが2ヶ月/1ヶ月を切っている車両や期限切れの車両には、その場でメッセージと「車検完了を記録」への直接リンクを出します — 要件どおり「アプリ内表示のみ」で、メール・Push・LINE・Cron の類は一切作っていません。

車両一覧（`listVehiclesFn`）と整備記録の全件（`listAllRecordsFn`、 Phase 7 で新設）を並行取得し、Phase 3 で完成済みの純粋関数 `dashboard/lib/build-summary.ts` の `buildVehicleSummaries` にそのまま渡すだけで、車両ごとのサマリー（車検アラート段階・現在の走行距離・最終整備日）が組み上がります。DBアクセス・日付計算・表示整形は一切このファイルに持ち込まず、それぞれサーバー関数／`lib/date`／`dashboard/lib`に委譲する、これまでのフェーズと一貫した設計です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/_authed/`（URL は `/`）ルートの定義。`loader`で車両・整備記録を並行取得 |
| `toSummaryVehicle` | function | DBの車両行を `build-summary.ts` が要求する形へ変換 |
| `Dashboard` | function（component） | サマリー一覧・車検アラート・ログアウトボタンを表示する |

## コード解説

```ts
export const Route = createFileRoute('/_authed/')({
  loader: async () => {
    const [vehicles, records] = await Promise.all([listVehiclesFn(), listAllRecordsFn()])
    return { vehicles, records }
  },
  component: Dashboard,
})
```

車両一覧と整備記録全件は互いに依存しないため、`records/new.tsx` （Phase 6）と同じく `Promise.all` で並行取得します。整備記録は「車両ごとに絞り込んでから取得」ではなく、Phase 7 で新設した `listAllRecordsFn` で車両を問わず一括取得し、車両ごとの集計はクライアント側（正確には `buildVehicleSummaries`）に任せます。

```ts
const today = todayInJst()
const summaryVehicles = vehicles.map(toSummaryVehicle)
const summaryRecords: SummaryRecord[] = records.map((row) => ({
  vehicleId: row.vehicle_id,
  performedOn: toDateString(row.performed_on),
  odometerKm: row.odometer_km,
}))
const summaries = buildVehicleSummaries(summaryVehicles, summaryRecords, today)
```

DBの行（スネークケース）を `dashboard/lib` が要求する形（キャメルケース）へ変換してから渡す、という手順は `_authed.vehicles.$vehicleId.index.tsx` の `toFilterable` と同じパターンです。`todayInJst()` はサーバー（Cloudflare Workers・常にUTC）でもブラウザ（JST）でも同じ結果を返すため、 `loader`側で呼んでもコンポーネント側で呼んでもハイドレーション不整合は起きません（詳細は `lib/date/jst.ts`）。

```ts
const expiryByVehicleId = new Map<string, DateString | null>(
  summaryVehicles.map((vehicle) => [vehicle.id, vehicle.shakenExpiryDate]),
)

function shakenAlertFor(summary: VehicleSummary) {
  if (summary.shakenTier === 'none') {
    return null
  }
  const expiry = expiryByVehicleId.get(summary.vehicleId) ?? null
  return shakenTierMessage(summary.shakenTier, daysUntilExpiry(expiry, today))
}
```

`VehicleSummary`（`build-summary.ts`の戻り値）は意図的に「段階（`shakenTier`）」までしか持たず、日本語メッセージ（`shakenTierMessage`）が必要とする「残り日数」までは含みません（どちらの関数も Phase 3 で単一責務に分けて作ったため）。残り日数を求めるには満了日そのものが要るので、車両IDから満了日を引ける `Map` をここで一度だけ作り、表示直前に組み立てています。

```ts
{alertMessage && (
  <p role={summary.shakenTier === 'warning' ? 'status' : 'alert'}>
    {alertMessage}{' '}
    <Link to="/vehicles/$vehicleId/shaken" params={{ vehicleId: summary.vehicleId }}>
      車検完了を記録
    </Link>
  </p>
)}
```

`role` の出し分けは `record-form.tsx` の走行距離逆行警告（`role="status"`）と入力エラー（`role="alert"`）の区別を踏襲しています。「警告（残り2ヶ月）」はまだ猶予があるため `status`、「危険（残り1ヶ月）」「期限切れ」はより緊急なため `alert` としました。「車検完了を記録」へのリンクをその場に置くことで、ダッシュボードから2タップ以内で記録フォームに到達できます。

```ts
async function handleLogout() {
  setLoggingOut(true)
  setLogoutError(null)
  try {
    await logoutFn()
    await navigate({ to: '/login', replace: true })
  } catch {
    setLogoutError('ログアウトに失敗しました。時間をおいて再度お試しください。')
  } finally {
    setLoggingOut(false)
  }
}
```

**Phase 8のコードレビューで、以前はここに `catch` が無く、 `logoutFn` が失敗（ネットワークエラー等）すると例外が未処理のまま握りつぶされ、ボタンが活性に戻るだけで利用者には何も表示されないことが指摘され、修正しました。** 車両・整備記録の登録／更新フォーム（`vehicle-form.tsx` など）は元から同じパターンで `catch` していたため、ここも揃えることで「失敗したら必ず画面にエラーを出す」という一貫性を保っています。

---

*生成日: 2026-09-19（Phase 8でログアウト失敗時のエラー表示を追加） ／ 対象ファイル: src/routes/\_authed.index.tsx*
