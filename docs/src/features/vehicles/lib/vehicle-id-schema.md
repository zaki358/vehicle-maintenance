# vehicle-id-schema.ts

`src/features/vehicles/lib/vehicle-id-schema.ts`

## 概要

車両IDを検証するだけの小さな Zod スキーマです。Phase 5 で新設した `features/vehicles/server/{get,update,delete}.ts` の入口で共通して使います。 URLパラメータ（`$vehicleId`）や削除ボタンから渡ってくる ID がそもそも UUID の形をしていない場合に、DB へ問い合わせる前に弾くのが役割です。

その ID が「存在しない」のか「他人の車両で見えない」のかはこのスキーマの責務ではなく、RLS と `get.ts`/`update.ts` 側の判断に委ねています（詳しくは各ファイルのコメントを参照）。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `vehicleIdSchema` | const（export） | `{ id: string }` が UUID 形式であることを検証するスキーマ |
| `VehicleIdInput` | type（export） | `vehicleIdSchema` から推論した入力の型 |

## コード解説

```ts
export const vehicleIdSchema = z.object({
  id: z.uuid('車両IDの形式が正しくありません'),
})
```

Zod 4 の `z.uuid()`（Zod 3系までの `z.string().uuid()` から変わった書き方）で、`id` フィールドが UUID の形をしているかだけを見ます。 DB に実在するか・自分の車両かはここでは判定しません。無効な形式の値をわざわざ Supabase へ問い合わせて確かめる無駄を避けるための、入口での最低限のフィルタです。

```ts
export type VehicleIdInput = z.infer<typeof vehicleIdSchema>
```

`vehicle-schema.ts` と同じ理由で、型はスキーマから逆算しています。 `get.ts` / `update.ts` / `delete.ts` のハンドラ関数の引数の型としてそのまま使われます。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/vehicles/lib/vehicle-id-schema.ts*
