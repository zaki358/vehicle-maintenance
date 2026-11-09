# list.ts

`src/features/vehicles/server/list.ts`

## 概要

ログイン中ユーザーの車両一覧を返すサーバー関数です。車両一覧ページ（`routes/_authed.vehicles.index.tsx`）の `loader` から呼ばれます。 Phase 4 の `auth/server/*.ts` で確立した「`xxxHandler`（純粋なロジック）と `xxxFn`（`createServerFn` のラッパー）を分ける」パターンを、このプロジェクトで初めて DB テーブルを触るコードに適用した最初の例です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `VehicleRow` | type（export） | `vehicles` テーブルの行の型（`database.types.ts` から抽出） |
| `listVehiclesHandler` | async function（export） | DB問い合わせの実処理。`deps` 注入でテスト可能 |
| `listVehiclesFn` | const（export） | `createServerFn` でラップした、実際にルートから呼ぶ関数 |

## コード解説

```ts
interface ListVehiclesDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}
```

Supabase クライアント全体ではなく、実際に使う `.from()` メソッドだけを `Pick` で抜き出した型を要求します。`auth/server/login.ts` が `Pick<SupabaseClient<Database>['auth'], 'signInWithPassword'>` としているのと同じ考え方です。テストではこの形に合う `{ from: vi.fn() }` という最小限のオブジェクトを渡すだけで済み、Supabase クライアント全体をモックする必要がありません。

```ts
export async function listVehiclesHandler(deps: ListVehiclesDeps): Promise<VehicleRow[]> {
  const { data, error } = await deps.supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`user_id` での絞り込みをコード側に一切書いていないのが最大の要点です。 `vehicles_select_own` という RLS ポリシーが `auth.uid() = user_id` の行だけを返すことをすでに保証しているため、ここで同じ条件を重ねて書くと「RLS が正しく機能しているか」をアプリのコードが隠してしまいます。エラー時は握りつぶさず例外を投げ、呼び出し元（ルートの `loader`）に伝播させます。

```ts
export const listVehiclesFn = createServerFn({ method: 'GET' }).handler(() =>
  listVehiclesHandler({ supabase: createSupabaseServerClient() }),
)
```

`createSupabaseServerClient()` の呼び出しをこの `.handler()` コールバックの中だけに押し込めています。これは `get-session.ts` と全く同じ理由です。デフォルト引数などでこの呼び出しをハンドラ関数の外に出してしまうと、クライアントバンドルにサーバー専用コードが混入し、 TanStack Start のビルドが import-protection エラーで失敗します。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/server/list.ts*
