# record-schema.ts

`src/features/maintenance/lib/record-schema.ts`

## 概要

整備記録の登録・編集フォームの入力を検証する Zod スキーマです。フォーム側（`record-form.tsx`）の送信前チェックと、サーバー関数（`server/create.ts` / `server/update.ts`）の入口検証の**両方**がこの同じスキーマを使います。サーバー関数は実 HTTP エンドポイントなので、クライアント側の検証は信用せず必ずサーバー側でも通します。

このスキーマの特徴は、**必須項目が作業内容の区分によって変わる** ことです（部品交換なら交換内容と部品型式が必須、調整なら調整内容だけ、など）。どの欄をどう扱うかの判断は自分で持たず、すべて `workTypeFields()`（`work-types.ts`）に委ねます。フォームの描画とこの検証が同じ定義を読むため、画面と検証がずれません。

さらに検証のあと、**その区分では使わない項目を空へ戻す** `.transform()` を挟んでいます。これがこのファイルのもう一つの役割です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `DETAIL_MAX_LENGTH` | const（非export） | 作業内容の最大文字数（100） |
| `PART_DETAIL_MAX_LENGTH` | const（非export） | 部品型式の最大文字数（200） |
| `OIL_TYPE_MAX_LENGTH` | const（非export） | 油種の最大文字数（50） |
| `NOTE_MAX_LENGTH` | const（非export） | 備考の最大文字数（1000） |
| `recordSchema` | Zod スキーマ（export） | object → superRefine → transform の3段構成 |
| `RecordInput` | type（export） | `z.infer` による出力型 |

## コード解説

```ts
const DETAIL_MAX_LENGTH = 100
const PART_DETAIL_MAX_LENGTH = 200
const OIL_TYPE_MAX_LENGTH = 50
const NOTE_MAX_LENGTH = 1000
```

上限値を定数に切り出し、エラーメッセージにもテンプレートリテラルで埋め込んでいます（`内容は100文字以内で入力してください`）。値と文言が二重管理にならず、上限を変えたときに文言が古いまま残りません。

DB 側（`maintenance_records` テーブル）はこれらの列を `text` で持ち、文字数の上限を持ちません。「長さの上限はアプリの入力ポリシー、構造は DB」という役割分担で、マイグレーションのコメントにも同じ方針が書かれています。

```ts
export const recordSchema = z
  .object({
    performedOn: dateStringSchema,
    workType: z.enum(WORK_TYPES, { error: '作業内容を選択してください' }),
    detail: z
      .string()
      .trim()
      .max(DETAIL_MAX_LENGTH, `内容は${DETAIL_MAX_LENGTH}文字以内で入力してください`)
      .default(''),
    odometerKm: z
      .number()
      .int('走行距離は整数で入力してください')
      .nonnegative('走行距離は0以上で入力してください')
      .nullable()
      .default(null),
    ...
  })
```

**日付** — `performedOn` には共通の `dateStringSchema` を使い、branded な `DateString` として扱います。Cloudflare Workers は常に `TZ=UTC` で動くため、日付を `Date` に変換するとタイムゾーンずれが発生します。文字列のまま扱うのがこのプロジェクトの原則です。

**区分** — `z.enum(WORK_TYPES)` により、 `work-types.ts` の9区分以外は入口で弾かれます。区分を増減したときにスキーマ側を直す必要はありません。

**テキスト欄** — `detail` / `partDetail` / `oilType` / `note` はいずれも `.trim().max(...)` `.default('')` の形です。`trim()` を先に通すことで、空白だけの入力は空文字になり、後述の必須チェックで「未入力」として弾かれます。未入力を `null` ではなく空文字に統一しているのは、DB 側の列も `not null default ''` で定義されているためです（「未入力」の表現が2つに分かれるのを避ける）。

**走行距離** — `odometerKm` の `null` はエラーではなく「走行距離を記録しなかった」という**正常値**です。整数・0以上のみ許可します。

**エレメント交換** — `elementChanged` は `z.boolean().default(false)`。チェックボックス1つに対応します。

```ts
  .superRefine((data, ctx) => {
    const fields = workTypeFields(data.workType)

    if (fields.detail === 'required' && data.detail.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `${fields.detailLabel}を入力してください`,
        path: ['detail'],
      })
    }

    if (fields.partDetail === 'required' && data.partDetail.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: '部品型式を入力してください',
        path: ['partDetail'],
      })
    }
  })
```

**区分に依存する必須チェック**です。`detail` と `partDetail` は個々のフィールド定義では必須にできません（区分によって必須かどうかが変わるため）。そこでオブジェクト全体が揃ったあとの `superRefine` で、`workTypeFields()` に問い合わせてから判定します。

エラーメッセージが `fields.detailLabel` から組み立てられているのがポイントです。部品交換なら「交換内容を入力してください」、修理なら「修理内容を入力してください」と、画面に出ているラベルと必ず同じ言葉になります。文言をスキーマ側にベタ書きしていたら、ラベルを変えたときにここだけ古くなります。

`refine` ではなく `superRefine` を使っているのは、複数のエラーを `path` 付きで積めるためです。ただし現状のフォームは `issues[0]` のみを表示します。

```ts
  .transform((data) => {
    const fields = workTypeFields(data.workType)

    return {
      ...data,
      detail: fields.detail === 'hidden' ? '' : data.detail,
      partDetail: fields.partDetail === 'hidden' ? '' : data.partDetail,
      oilType: fields.oilType ? data.oilType : '',
      elementChanged: fields.elementChanged ? data.elementChanged : false,
    }
  })
```

**その区分では使わない値を落とす正規化**です。フォームは区分を切り替えても入力値を保持する設計（「部品交換」で書いた内容を「修理」に付け替えられるようにするため）なので、送信時に前の区分の入力が残っていることがあります。それをそのまま保存すると、例えば **車検の行に部品型式が入る**ような、読み直したときに意味の通らない行ができてしまいます。

この `transform` が保存直前に空へ戻すため、DB には区分と整合した行だけが入ります。マイグレーション `20260920110100_rework_maintenance_work_types.sql` の CHECK 制約とも整合する形です。

`{ ...data, ... }` と新しいオブジェクトを返しており、引数の `data` は書き換えていません（プロジェクト全体の不変データ方針）。

**副作用として型が ZodEffects になる**点に注意が必要です。 `superRefine` / `transform` を挟んだスキーマは `.shape` を持たないため、`server/create.ts` では `vehicleScopeSchema.extend(recordSchema.shape)` のような合成ができず、 `.extend({ record: recordSchema })` とネストさせる形を取っています。

```ts
export type RecordInput = z.infer<typeof recordSchema>
```

`z.infer` は `transform` 後の**出力型**を返します。フォームの `initialValues` やサーバー関数の引数はこの型で受け渡しされるため、スキーマを変えれば呼び出し側の型も自動的に追従します。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/maintenance/lib/record-schema.ts*
