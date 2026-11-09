# complete-shaken.ts

`src/features/shaken/server/complete-shaken.ts`

## 概要

車検完了を記録するサーバー関数です。「整備記録（`work_type = 'shaken'`）を 1件挿入する」「車両の満了日を更新する」という2つのテーブル書き込みを、 Postgres 関数 `complete_shaken`（Phase 2 で作成済みの RPC）を 1回呼ぶことで、1トランザクションとして実行します。

なぜ RPC が必要かというと、PostgREST の単発リクエスト（`.from().insert()` や `.from().update()`）はテーブルを跨いだトランザクションを組めないためです。素朴に2回に分けて呼ぶと、途中でエラーが起きたときに「整備記録だけ増えて満了日が更新されない」という半端な状態が起こりえます。この関数はその隙を無くすのが存在理由です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `completeShakenRequestSchema` | const | `vehicleScopeSchema` と `completeShakenSchema` を合成した入力スキーマ |
| `CompleteShakenRequestInput` | type（export） | 合成スキーマから推論した入力型 |
| `CompletedShakenRecord` | type（export） | RPCが返す `maintenance_records` 行の型 |
| `CompleteShakenDeps` | interface | ハンドラが必要とする Supabase クライアントの最小インターフェース（`rpc` のみ） |
| `completeShakenHandler` | async function（export） | RPCを呼び出す純粋なハンドラ |
| `completeShakenFn` | const（export） | `createServerFn` でラップした実HTTPエンドポイント |

## コード解説

```ts
const completeShakenRequestSchema = vehicleScopeSchema.extend({ shaken: completeShakenSchema })
```

`maintenance/server/create.ts` の `createRecordSchema` と同じ合成パターンです。「どの車両か」（`vehicleId`）と「車検完了の入力内容」（`shaken`）を、ネストしたフィールドとして合成しています。`vehicleScopeSchema` は本来 `maintenance` 機能のスキーマですが、`dashboard/lib/build-summary.ts` が `shaken/lib` や `vehicles/lib` を横断的にインポートしている既存の前例にならい、機能をまたいだ再利用としてそのままインポートしています。

```ts
export async function completeShakenHandler(
  input: CompleteShakenRequestInput,
  deps: CompleteShakenDeps,
): Promise<CompletedShakenRecord> {
  const { data, error } = await deps.supabase.rpc('complete_shaken', {
    p_vehicle_id: input.vehicleId,
    p_performed_on: input.shaken.performedOn,
    p_new_expiry_date: input.shaken.newExpiryDate,
    p_odometer_km: input.shaken.odometerKm ?? undefined,
    p_part_detail: input.shaken.partDetail,
    p_note: input.shaken.note,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

他のサーバー関数が `deps.supabase.from(...)` を使うのに対し、ここでは `deps.supabase.rpc(...)` を使う点が特徴です。 `CompleteShakenDeps` も `Pick<SupabaseClient<Database>, 'rpc'>` と絞り込み、テストでは `rpc` だけをモックすれば済むようにしています。

`p_odometer_km: input.shaken.odometerKm ?? undefined` の変換が要点です。 `database.types.ts` が生成した RPC の引数型では `p_odometer_km` は `number | undefined`（`null` 不可）ですが、アプリ内では「走行距離を記録しなかった」を `null` で表現する規約（`record-schema.ts` と同じ）のため、ここで橋渡しをしています。

RPC 自体は Phase 2 で `security invoker` として作成済みのため、呼び出したユーザーの権限で実行されます。他人の車両IDを渡しても RLS がブロックし、関数内の `if not found then raise exception` で例外になります。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/shaken/server/complete-shaken.ts*
