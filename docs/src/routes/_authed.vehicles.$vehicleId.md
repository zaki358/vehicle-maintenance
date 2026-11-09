# \_authed.vehicles.$vehicleId.tsx

`src/routes/_authed.vehicles.$vehicleId.tsx`

## 概要

`/vehicles/$vehicleId` 配下（詳細ページ・編集ページ）をまとめるレイアウトルートです。ファイル名の先頭が `_authed` なのは「ログイン必須」の意味で、`$vehicleId` の部分は URL の動的セグメント（実際の車両 ID）を表します。

`_authed.tsx` が「ログイン中の user」を route context に積んだのと同じやり方で、ここでは「対象の車両」を1回だけ取得して積みます。これにより子ルート（詳細・編集）は個別に `getVehicleFn` を呼び直す必要がなく、 `Route.useRouteContext()` で `vehicle` を受け取るだけで済みます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/vehicles/$vehicleId` レイアウトルートの定義 |
| `VehicleNotFound` | function（component） | 車両が見つからない場合の表示 |

## コード解説

```ts
export const Route = createFileRoute('/_authed/vehicles/$vehicleId')({
  beforeLoad: async ({ params }) => {
    const vehicle = await getVehicleFn({ data: { id: params.vehicleId } })
    if (!vehicle) {
      throw notFound()
    }
    return { vehicle }
  },
  notFoundComponent: VehicleNotFound,
  component: () => <Outlet />,
})
```

存在しない ID と、他人の車両の ID（RLS がブロックする）は `getVehicleFn` の時点で両方とも `null` になるため、ここでの扱いも区別せず同じ `notFound()` に倒しています。 B が A の車両の URL を直接叩いても、「他人の車両が存在する」という情報は一切漏れません（見えるのは常に同じ「見つかりません」画面）。

`component: () => <Outlet />` はこのルート自身が何も描画せず、子ルート（`$vehicleId.index.tsx` や `$vehicleId.edit.tsx`）をそのまま表示するだけの「純粋なレイアウト」であることを表します。

```ts
function VehicleNotFound() {
  return (
    <main>
      <h1>車両が見つかりません</h1>
      <p>指定された車両は存在しないか、閲覧できません。</p>
      <p>
        <Link to="/vehicles">車両一覧へ戻る</Link>
      </p>
    </main>
  )
}
```

`notFound()` が投げられたときに TanStack Router が表示する専用のコンポーネントです。指定しない場合の既定表示（英語の簡素な “Not Found”）ではなく、日本語で状況を説明し一覧へ戻れるようにしています。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/routes/\_authed.vehicles.$vehicleId.tsx*
