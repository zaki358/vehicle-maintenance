# update.ts

`src/features/maintenance/server/update.ts`

## 概要

既存の整備記録を更新するサーバー関数です。`create.ts` と対になる構造を持ち、入口で `recordSchema` による検証を行ってから `maintenance_records` を `update` します。

作業内容の区分の入れ替えにより、更新する列が `detail`・ `oil_type`・`element_changed` を含む新しい構成に変わりました（廃止された `work_type_other` はありません）。

更新系ならではの判断として、**存在しない記録と他人の記録を区別せず `null` を返す**点、そして **`vehicle_id` を更新対象に含めない**点があります。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `updateRecordSchema` | Zod スキーマ（非export） | 記録ID + 記録本体の入力定義 |
| `UpdateRecordInput` | type（export） | `z.infer` による入力型 |
| `UpdateRecordDeps` | interface（非export） | ハンドラに注入する依存（Supabase クライアント） |
| `updateRecordHandler` | function（export） | 実際に `update` する本体。テスト対象 |
| `updateRecordFn` | server function（export） | HTTP エンドポイント。検証 → ハンドラ呼び出し |

## コード解説

```ts
const updateRecordSchema = recordIdSchema.extend({ record: recordSchema })

export type UpdateRecordInput = z.infer<typeof updateRecordSchema>
```

更新対象の `id`（`recordIdSchema`）と記録の中身を合成します。`create.ts` と同じく `record` というフィールドにネストさせるのは、`recordSchema` が `superRefine` / `transform` を挟んだ ZodEffects で `.shape` を持たず、平坦な `extend` ができないためです。

この合成により、区分ごとの必須チェックと「使わない値を空へ戻す」正規化が更新時にもそのまま働きます。編集画面で区分を切り替えて保存しても、前の区分の値が残ったまま DB に書き込まれることはありません。

```ts
interface UpdateRecordDeps {
  supabase: Pick<SupabaseClient<Database>, 'from'>
}
```

`create.ts` と同じく、使う機能だけを `Pick` で切り出した依存型です。テストでは `from` だけを持つモックを渡して `updateRecordHandler` を直接呼べます。

```ts
export async function updateRecordHandler(
  input: UpdateRecordInput,
  deps: UpdateRecordDeps,
): Promise<MaintenanceRecordRow | null> {
  const { data, error } = await deps.supabase
    .from('maintenance_records')
    .update({
      performed_on: input.record.performedOn,
      work_type: input.record.workType,
      detail: input.record.detail,
      odometer_km: input.record.odometerKm,
      part_detail: input.record.partDetail,
      oil_type: input.record.oilType,
      element_changed: input.record.elementChanged,
      note: input.record.note,
    })
    .eq('id', input.id)
    .select()
    .maybeSingle()
```

**`vehicle_id` が更新対象に入っていない**のが意図的です。記録を別の車両へ付け替える操作はこのアプリでは提供しません。列を更新対象から外すことで、その操作を「できない」形で表現しています。 `user_id` も同様に触りません（DB 側が `auth.uid()` で管理する列のため）。

`.eq('id', input.id)` で対象を絞りますが、**所有者の条件を書いていない**点に注意してください。他人の記録を弾くのは RLS の UPDATE ポリシー（`USING` と `WITH CHECK` の両方）の役目で、アプリ側の条件に頼らない設計です。

`single()` ではなく `maybeSingle()` を使っているため、 0件でもエラーにならず `data` が `null` になります。これが次の説明につながります。

```ts
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

**存在しない記録と、他人の記録（RLS がブロック）を区別しません。** どちらの場合も `maybeSingle()` が `null` を返し、呼び出し側からは同じ「見つからなかった」に見えます。

これはセキュリティ上の判断です。区別してしまうと、他人の ID を総当たりで送ることで「その ID の記録が存在するか」を調べられてしまいます（`vehicles/server/update.ts` と同じ方針）。

```ts
export const updateRecordFn = createServerFn({ method: 'POST' })
  .validator(updateRecordSchema)
  .handler(({ data }) => updateRecordHandler(data, { supabase: createSupabaseServerClient() }))
```

`.validator()` により、ハンドラに入る前に必ず検証が走ります。サーバー関数は実 HTTP エンドポイントなので、画面を経由しない直接リクエストもここで同じ検証を受けます。

`createSupabaseServerClient()` をハンドラ内で毎回生成するのも `create.ts` と同じです。モジュールスコープでメモ化すると Cloudflare Workers の isolate 再利用で他人のセッションを掴む恐れがあります。

**車検の記録を編集してもこの関数で処理されます。** 編集画面は `RecordForm` に `shakenRenewal` を渡さないため、作業内容が「車検」のままでも `complete_shaken` RPC には回らず、車両の満了日は再更新されません。過去の記録を直しただけで現在の満了日が巻き戻る、という事故を防ぐための設計です。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/maintenance/server/update.ts*
