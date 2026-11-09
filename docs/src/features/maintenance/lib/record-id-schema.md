# record-id-schema.ts

`src/features/maintenance/lib/record-id-schema.ts`

## 概要

整備記録自身の ID を検証するだけの小さな Zod スキーマです。 `features/vehicles/lib/vehicle-id-schema.ts` と全く同じ形（`{ id: uuid }`）ですが、検証対象のリソース（整備記録）が異なることをエラーメッセージと型名で明示するために独立したファイルとして持っています。

`server/update.ts`・`server/delete.ts` の入口で、「更新・削除したい整備記録の ID」がそもそも UUID の形をしているかを、 DB へ問い合わせる前に確認するために使います。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `recordIdSchema` | const（export） | `{ id: string }` が UUID 形式であることを検証するスキーマ |
| `RecordIdInput` | type（export） | `recordIdSchema` から推論した入力の型 |

## コード解説

```ts
export const recordIdSchema = z.object({
  id: z.uuid('整備記録IDの形式が正しくありません'),
})
```

フィールド名は `id`（この記録自身の ID）です。 `server/update.ts` ではこのスキーマを `.extend({ record: recordSchema })` で合成し、「どの記録を」「どんな内容に」更新するかをまとめて検証します。

```ts
export type RecordIdInput = z.infer<typeof recordIdSchema>
```

`server/delete.ts` のハンドラ関数の引数の型としてそのまま使われます。存在しない・他人の記録かどうかの判定はこのスキーマの責務外で、RLS と各ハンドラ側に委ねています。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/lib/record-id-schema.ts*
