# create.ts

`src/features/maintenance/server/create.ts`

## 概要

整備記録を新規作成するサーバー関数です。TanStack Start の `createServerFn` で定義され、実体は HTTP エンドポイントとして公開されます。そのためクライアント側の検証は一切信用せず、入口で必ず `recordSchema` を通します。

作業内容の区分の入れ替えにより、`insert` する列が変わりました。廃止された `work_type_other`（旧「その他」の自由入力）に代わり、 `detail`・`oil_type`・`element_changed` の 3列を書き込みます。

DB アクセスを行う `createRecordHandler` と、それを HTTP に接続する `createRecordFn` を分けているのがこのファイルの構造です。ハンドラは Supabase クライアントを引数で受け取るため、テストからモックを差し込んで呼べます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `createRecordSchema` | Zod スキーマ（非export） | 車両スコープ + 記録本体の入力定義 |
| `CreateRecordInput` | type（export） | `z.infer` による入力型 |
| `CreateRecordDeps` | interface（非export） | ハンドラに注入する依存（Supabase クライアント） |
| `createRecordHandler` | function（export） | 実際に `insert` する本体。テスト対象 |
| `createRecordFn` | server function（export） | HTTP エンドポイント。検証 → ハンドラ呼び出し |

## コード解説

```ts
const createRecordSchema = vehicleScopeSchema.extend({ record: recordSchema })

export type CreateRecordInput = z.infer<typeof createRecordSchema>
```

どの車両の記録かを示す `vehicleId`（`vehicleScopeSchema`）と、記録の中身（`recordSchema`）を合成した入力定義です。

**`record` というフィールドにネストさせているのには理由があります。** `recordSchema` は `superRefine` と `transform` を挟んだ ZodEffects のため `.shape` を持たず、 `vehicleScopeSchema.extend(recordSchema.shape)` の形では合成できません（`vehicles/server/update.ts` の `vehicleIdSchema.extend(vehicleSchema.shape)` が平坦に書けるのと対照的です）。 1つのフィールドとしてネストさせれば、内側のスキーマがどんな型であっても合成できます。

この形のおかげで、区分ごとの必須チェックと「使わない値を空へ戻す」正規化がサーバー側でもそのまま効きます。クライアントが区分と矛盾した値を直接送りつけても、`insert` に届く時点では正規化済みです。

```ts
interface CreateRecordDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}
```

依存を `Pick<..., 'from'>` に絞っているのが要点です。このハンドラが使うのは `from()` だけなので、テストのモックも `from` だけ実装すれば型が合います。`SupabaseClient` 全体を要求すると、使いもしない `auth` や `storage` までモックしなければならなくなります。

```ts
export async function createRecordHandler(
  input: CreateRecordInput,
  deps: CreateRecordDeps,
): Promise<MaintenanceRecordRow> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .insert({
      vehicle_id: input.vehicleId,
      performed_on: input.record.performedOn,
      work_type: input.record.workType,
      detail: input.record.detail,
      odometer_km: input.record.odometerKm,
      part_detail: input.record.partDetail,
      oil_type: input.record.oilType,
      element_changed: input.record.elementChanged,
      note: input.record.note,
    })
    .select()
    .single()
```

**`user_id` を渡していないのが最も重要な点**です。 `maintenance_records` の `user_id` 列は既定値 `auth.uid()` を持ち、DB 側がセッションから自動的に埋めます。クライアントから受け取った値を入れないことで、他人の ID を詐称して記録を作る余地そのものを無くしています（`vehicles/server/create.ts` と同じ方針）。

書き込む列は `detail` / `oil_type` / `element_changed` を含む新しい構成です。廃止された `work_type_other` はもう存在しません。区分で使わない値は `recordSchema` の `transform` が空へ戻しているため、ここでは区分による分岐を書く必要がありません。DB 側の CHECK 制約（`maintenance_records_detail_required` など）も同時に効くので、万一 Zod を迂回されても不整合な行は入りません。

`.select().single()` で挿入した行をそのまま返します。 `id` や `created_at` など DB が生成した値を追加のクエリなしに呼び出し側へ返せます。`single()` は 1行でなければエラーになるため、期待どおりの結果であることも保証されます。

```ts
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

エラーは握り潰さず送出します。RLS に拒否された場合（他人の車両に記録を足そうとした場合など）もここに来ます。なお作成系では、更新系（`update.ts`）のように `null` を返してぼかす扱いはしません。作成は対象行の存在を問い合わせる操作ではないため、 ID の存在を推測させる情報漏れにはつながらないからです。

```ts
export const createRecordFn = createServerFn({ method: 'POST' })
  .validator(createRecordSchema)
  .handler(({ data }) => createRecordHandler(data, { supabase: createSupabaseServerClient() }))
```

HTTP への接続部分です。`.validator()` により、ハンドラに入る前に必ず `createRecordSchema` の検証を通ります。これが「全書き込みはサーバー関数の入口で Zod 検証する」というプロジェクト規約の実装です。

`createSupabaseServerClient()` を**ハンドラの中で毎回呼ぶ** 点が重要です。モジュールスコープでメモ化すると、Cloudflare Workers の isolate が再利用されたときに前のリクエストのセッションを掴み、他人のデータを操作してしまいます。

なお作業内容が「車検」の記録は、新規登録時はこの関数を通りません。整備記録の挿入と車両の満了日更新を1トランザクションで行う必要があるため、 `complete_shaken` RPC を呼ぶ `features/shaken/server/complete-shaken.ts` が使われます。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/maintenance/server/create.ts*
