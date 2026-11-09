# date-string-schema.ts

`src/lib/date/date-string-schema.ts`

## 概要

フォーム入力の文字列を検証し、`date-string.ts` が定義する `DateString`（実在する `YYYY-MM-DD` 形式であることが保証された日付文字列）へ絞り込む Zod スキーマを1つだけ提供します。

車両の車検満了日、整備記録の実施日など、このアプリで日付を入力させるフォームは複数ありますが、「本当にその日付が存在するか」（例: `2026-02-30` は形式は正しく見えても存在しない）という検証ロジックを各フォームのスキーマにそれぞれ書いてしまうと、判定基準が少しずつズレていくリスクがあります。このファイルは `vehicle-schema.ts` （車両）と `record-schema.ts`（整備記録）の両方から共有される、日付検証の唯一の入り口です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `dateStringSchema` | const（export） | 文字列を検証して `DateString` に絞り込む Zod スキーマ |

## コード解説

```ts
export const dateStringSchema = z.string().transform((value, ctx) => {
  if (!isDateString(value)) {
    ctx.addIssue({ code: 'custom', message: '日付は YYYY-MM-DD 形式で、実在する日付を指定してください' })
    return z.NEVER
  }
  return value
})
```

検証そのものは `date-string.ts` の `isDateString` に丸ごと委譲しています。これにより「日付として実在するか」の判定基準は `date-string.ts` の1箇所だけに存在し、Zod スキーマ側ではそれを呼び出すだけになります。

`.refine()` ではなく `.transform()` を使っているのは、検証を通過した値を `DateString`（ブランド型）として扱いたいためです。 `isDateString` は TypeScript の型ガード（`value is DateString`）なので、`if (!isDateString(value))` を通過した後の `return value` は自動的に `DateString` 型として推論されます。検証に失敗した場合は `ctx.addIssue` でエラー内容を積んだ上で `z.NEVER` を返し、Zod にこの入力が無効であることを伝えます。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/lib/date/date-string-schema.ts*
