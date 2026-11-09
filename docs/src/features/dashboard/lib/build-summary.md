# build-summary.ts

`src/features/dashboard/lib/build-summary.ts`

## 概要

ダッシュボード（および車両詳細ページ）に表示する「車両ごとのまとめ」を組み立てる純粋関数です。車両1台分の情報（車種名・区分・車検満了日）と整備記録一覧から、**車検アラートの段階**・**現在の走行距離**・**直近整備からの経過**をまとめた 1つのオブジェクトを作ります。

実装プランの設計判断どおり、`vehicles.current_odometer` のようなカラムは持たず（記録の編集・削除で値がずれるため）、常に整備記録の `odometerKm` の最大値から現在の走行距離をその場で導出します。この「導出」の実体がこのファイルです。

車検アラートの判定自体は `shaken/lib/alert-tier.ts` に、直近整備の算出は同じディレクトリの `since-last-service.ts` に委譲し、このファイルはそれらを1台の車両分・複数台分にまとめる「組み立て役」に徹しています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `SummaryVehicle` | type（export） | サマリー作成に必要な車両の最小限の情報 |
| `SummaryRecord` | type（export） | サマリー作成に必要な整備記録の最小限の情報 |
| `VehicleSummary` | type（export） | 組み立て後の1台分のサマリー |
| `buildVehicleSummary` | function（export） | 車両1台分のサマリーを組み立てる |
| `buildVehicleSummaries` | function（export） | 複数車両分のサマリーを配列で組み立てる |

## コード解説

```ts
export type SummaryVehicle = {
  id: string
  name: string
  vehicleType: VehicleType
  shakenExpiryDate: DateString | null
}

export type SummaryRecord = {
  vehicleId: string
  performedOn: DateString
  odometerKm: number | null
}

export type VehicleSummary = {
  vehicleId: string
  name: string
  vehicleType: VehicleType
  shakenTier: ShakenAlertTier
  currentOdometerKm: number | null
  lastService: LastServiceInfo | null
}
```

`SummaryVehicle` / `SummaryRecord` は、 DB から取得する行の完全な型ではなく「このファイルが実際に必要とするフィールドだけ」を持つ最小限の型です。呼び出し側は、より多くのフィールドを持つ実際のデータ（例えば整備記録の `note` や `partDetail`）をそのまま渡しても問題なく動きます。

```ts
export function buildVehicleSummary(
  vehicle: SummaryVehicle,
  records: readonly SummaryRecord[],
  today: DateString,
): VehicleSummary {
  const vehicleRecords = records.filter((record) => record.vehicleId === vehicle.id)
  const odometerReadings = vehicleRecords
    .map((record) => record.odometerKm)
    .filter((odometerKm): odometerKm is number => odometerKm !== null)

  return {
    vehicleId: vehicle.id,
    name: vehicle.name,
    vehicleType: vehicle.vehicleType,
    shakenTier: shakenAlertTier(vehicle.shakenExpiryDate, today),
    currentOdometerKm: odometerReadings.length === 0 ? null : Math.max(...odometerReadings),
    lastService: sinceLastService(vehicleRecords, today),
  }
}
```

**1. 対象車両の記録だけに絞る** — `records` には呼び出し側から複数車両分の記録がまとめて渡されることを想定し、まず `vehicle.id` に一致するものだけに絞り込みます。こうすることで、呼び出し側は車両ごとにフィルタ済みの配列を用意する手間が不要になります。

**2. 現在の走行距離を導出する** — `odometerKm` は整備記録ごとに未入力（`null`）もあり得るため、まず `null` を除外してから `Math.max` で最大値を取ります。1件も無ければ（`odometerReadings.length === 0`）、「まだ走行距離の記録が無い」ことを表す `null` を返します。 `filter` の型ガード（`odometerKm is number`）により、この後の `Math.max(...odometerReadings)` の型が `number[]` として扱われます。

**3. 車検アラートと直近整備を委譲する** — `shakenAlertTier`（`shaken/lib`）と `sinceLastService`（同じディレクトリ）は、それぞれ既にテスト済みのロジックなので、ここでは呼び出すだけに留め、判定条件を重複させません。

```ts
export function buildVehicleSummaries(
  vehicles: readonly SummaryVehicle[],
  records: readonly SummaryRecord[],
  today: DateString,
): VehicleSummary[] {
  return vehicles.map((vehicle) => buildVehicleSummary(vehicle, records, today))
}
```

ダッシュボード画面では車両を1台ずつではなく一覧で表示するため、こちらが実際の呼び出し口になります。全車両分の記録 `records` をまとめて受け取り、車両ごとの絞り込みは `buildVehicleSummary` 側に任せる形にすることで、呼び出し側（ルート/サーバー関数）は「車両一覧」と「記録一覧」をそのまま渡すだけで済みます。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/dashboard/lib/build-summary.ts*
