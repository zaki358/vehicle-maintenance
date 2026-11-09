# vehicle-scope-schema.ts

`src/features/maintenance/lib/vehicle-scope-schema.ts`

## 概要

「どの車両に属する整備記録を扱うか」という `vehicleId` 1個だけを検証する、Phase 5 の `vehicle-id-schema.ts` と同型の小さな Zod スキーマです。整備記録は必ずどこかの車両に属するため、一覧取得・部品サジェスト取得の入口でこの ID を検証します。

Phase 6 で新設した `server/create.ts` では、このスキーマを `.extend({ record: recordSchema })` という形で整備記録本体のスキーマと合成しています。`recordSchema` は `.refine()` で作られた ZodEffects のため `.shape` を持たず、直接 `.extend()` できません（Phase 5 の `vehicleIdSchema.extend(vehicleSchema.shape)` とは対称的な制約）。合成対象を `record` というネストしたフィールドとして持たせることで、内側のスキーマの形を問わず合成できるようにしています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `vehicleScopeSchema` | const（export） | `{ vehicleId: string }` が UUID 形式であることを検証するスキーマ |
| `VehicleScopeInput` | type（export） | `vehicleScopeSchema` から推論した入力の型 |

## コード解説

```ts
export const vehicleScopeSchema = z.object({
  vehicleId: z.uuid('車両IDの形式が正しくありません'),
})
```

フィールド名を `id`（vehicles/lib/vehicle-id-schema.ts）ではなく `vehicleId` にしているのは、`server/update.ts` の `recordIdSchema`（整備記録自身の `id`）と後で合成したときにフィールド名が衝突しないようにするためです。`server/create.ts` では `vehicleId` と `record`（整備記録本体）が同居し、 `server/update.ts` では記録自身の `id` と `record` が同居しますが、両者を混同する余地がありません。

```ts
export type VehicleScopeInput = z.infer<typeof vehicleScopeSchema>
```

`server/list.ts` と `server/list-part-details.ts` のハンドラ関数の引数の型としてそのまま使われます。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/lib/vehicle-scope-schema.ts*
