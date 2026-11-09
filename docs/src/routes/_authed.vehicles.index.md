# \_authed.vehicles.index.tsx

`src/routes/_authed.vehicles.index.tsx`

## 概要

車両一覧ページです。URL は `/vehicles`（ファイル名の `.index` は「親ルート自身のパスにマッチする」という TanStack Router の規約）。ログイン中ユーザーの車両を一覧表示し、新規登録ページと各車両の詳細ページへのリンクを出します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/vehicles` ルートの定義 |
| `VehiclesIndexPage` | function（component） | 一覧の描画 |

## コード解説

```ts
export const Route = createFileRoute('/_authed/vehicles/')({
  loader: () => listVehiclesFn(),
  component: VehiclesIndexPage,
})
```

`loader` でデータ取得を宣言しておくと、TanStack Router はナビゲーション中（画面遷移のアニメーションやコード分割の読み込みと並行して）にこれを実行します。コンポーネントが実際に描画される時点では `listVehiclesFn()` がすでに完了しているため、「ローディング中はスピナーを出して、終わったら描画する」というよくある2段階の書き方をせずに済みます。

```ts
const vehicles = Route.useLoaderData()
```

`loader` が返した値を型安全に取り出します。戻り値の型は `listVehiclesFn`（延いては `listVehiclesHandler`）から自動的に推論されます。

```ts
<Link to="/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>
  {vehicle.name}（{vehicleTypeLabel(vehicle.vehicle_type as VehicleType)}）
</Link>
```

`vehicle.vehicle_type` は DB の行の型では単なる `string`（Supabase の型生成はテーブルの CHECK 制約までは読み取らない）なので、`VehicleType`（`'car' | 'motorcycle'`）へキャストしています。これは外部から届いた値ではなく、自分たちが書いた CHECK 制約付きの自テーブルからの読み取りであるため許容しています。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/\_authed.vehicles.index.tsx*
