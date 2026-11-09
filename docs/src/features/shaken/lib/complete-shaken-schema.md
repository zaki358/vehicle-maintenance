# complete-shaken-schema.ts

`src/features/shaken/lib/complete-shaken-schema.ts`

## 概要

車検完了の入力を検証する Zod スキーマです。作業日・新しい満了日・走行距離・備考の4項目だけを持ちます。

以前はこのスキーマ専用の画面（`complete-shaken-form.tsx` と `/vehicles/$vehicleId/shaken` ルート）がありましたが、現在は削除され、 **整備記録フォーム（`record-form.tsx`）の中で作業内容に「車検」を選んだとき**にこのスキーマが使われます。車検は整備記録の追加と車両の満了日更新を1トランザクションで行う必要があるため、通常の `recordSchema` とは別経路（`complete_shaken` RPC）を通り、検証スキーマもこちらに切り替わります。

車検の行は区分名そのものが作業内容を表すため、`detail` も `part_detail` も `oil_type` も使いません。このスキーマに項目が少ないのはそのためで、`workTypeFields('shaken')` がすべて `hidden` / `false` を返すことと対応しています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `NOTE_MAX_LENGTH` | const（非export） | 備考の最大文字数（1000） |
| `completeShakenSchema` | Zod スキーマ（export） | 車検完了入力の検証定義 |
| `CompleteShakenInput` | type（export） | `z.infer` による入力型 |

## コード解説

```ts
export const completeShakenSchema = z.object({
  performedOn: dateStringSchema,
  newExpiryDate: dateStringSchema,
  ...
})
```

`performedOn` は車検を受けた日、`newExpiryDate` は更新後の満了日です。どちらも `dateStringSchema` による branded な `DateString` で、`Date` には変換しません。 Cloudflare Workers は常に `TZ=UTC` で動くため、日付を `Date` 経由で扱うと利用者の JST と1日ずれる恐れがあります。

**2つの日付の前後関係を検証していないのが意図的な判断**です。 `newExpiryDate` は `renewal.ts` の `computeNextShakenExpiry` が算出した提案値を画面に表示し、利用者が手で修正できる前提のフィールドです。制度どおりの計算と実際の満了日が一致しない場合がありうるため、ここでは「実在する日付か」だけを確かめ、それ以上の制約はかけません。計算結果はあくまで提案、というのがこのアプリの方針です。

```ts
  odometerKm: z
    .number()
    .int('走行距離は整数で入力してください')
    .nonnegative('走行距離は0以上で入力してください')
    .nullable()
    .default(null),
```

`recordSchema` の同名フィールドと同じ定義です。 `null` はエラーではなく「走行距離を記録しなかった」という正常値として扱います。

```ts
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
})

export type CompleteShakenInput = z.infer<typeof completeShakenSchema>
```

備考も他のスキーマと同じ扱いで、未入力は `null` ではなく空文字です（DB 側の `note` 列も `not null default ''`）。

`CompleteShakenInput` は `record-form.tsx` の `shakenRenewal.onSubmit` の引数型として使われ、そこから `features/shaken/server/complete-shaken.ts` のサーバー関数へ渡ります。サーバー関数は同じスキーマを `.validator()` に指定しているため、画面を迂回した直接リクエストでも同じ検証が働きます。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/shaken/lib/complete-shaken-schema.ts*
