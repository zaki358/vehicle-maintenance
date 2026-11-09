# vehicle-schema.ts

`src/features/vehicles/lib/vehicle-schema.ts`

## 概要

車両の登録・編集フォームの入力を検証する Zod スキーマです。フォーム（`vehicle-form.tsx`）の送信前チェックと、サーバー関数（`server/create.ts` / `server/update.ts`）の入口検証の両方が同じ定義を使います。サーバー関数は実 HTTP エンドポイントなので、クライアント側の検証結果は信用しません。

整備記録の `recordSchema` と違って `superRefine` や `transform` を持たない素の `z.object` です。そのため `.shape` を持ち、`vehicleIdSchema.extend(vehicleSchema.shape)` のように他のスキーマと平坦に合成できます。

今回の変更で `modelCode`（型式）が追加されました。車種名だけでは同名の別グレードを区別できないため、一覧や詳細で補足表示する目的の任意入力項目です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `NAME_MAX_LENGTH` | const（非export） | 車種名の最大文字数（50） |
| `MODEL_CODE_MAX_LENGTH` | const（非export） | 型式の最大文字数（50） |
| `NOTE_MAX_LENGTH` | const（非export） | 備考の最大文字数（1000） |
| `vehicleSchema` | Zod スキーマ（export） | 車両入力の検証定義 |
| `VehicleInput` | type（export） | `z.infer` による入力型 |

## コード解説

```ts
const NAME_MAX_LENGTH = 50
const MODEL_CODE_MAX_LENGTH = 50
const NOTE_MAX_LENGTH = 1000
```

上限値を定数化し、エラーメッセージにも同じ定数を埋め込んでいます。 DB 側の `vehicles` テーブルはこれらを `text` で持ち、文字数の上限を持ちません。長さの上限はアプリの入力ポリシー、構造は DB、という役割分担です（マイグレーション `20260920110000_add_vehicle_model_code.sql` のコメントにも同じ方針が書かれています）。

```ts
name: z
  .string()
  .trim()
  .min(1, '車種名を入力してください')
  .max(NAME_MAX_LENGTH, `車種名は${NAME_MAX_LENGTH}文字以内で入力してください`),
```

車種名は唯一の必須テキストです。`trim()` を `min(1)` より先に通しているため、空白だけの入力も「未入力」として弾かれます（順序が逆だと空白1文字が通ってしまいます）。

```ts
modelCode: z
  .string()
  .trim()
  .max(MODEL_CODE_MAX_LENGTH, `型式は${MODEL_CODE_MAX_LENGTH}文字以内で入力してください`)
  .default(''),
```

**今回追加された型式の欄**です。`min` を置かず `.default('')` にしているため、未入力は空文字として通ります。

「未入力」を `null` ではなく空文字に統一しているのが要点です。 DB 側も `model_code text not null default ''` で定義されており、 `null` と空文字という2種類の「未入力」が生まれないようにしています。 `note` や `part_detail` など既存の任意テキスト列と同じ方針です。

```ts
vehicleType: z.enum(['car', 'motorcycle'], { error: '車両区分を選択してください' }),
```

車両区分は車（`car`）とバイク（`motorcycle`）の2値です。 `z.enum` なので、フォームの `select` を迂回して別の値を送っても入口で弾かれます。表示用の日本語ラベルは `vehicle-type.ts` の `vehicleTypeLabel()` が持ちます。

```ts
shakenExpiryDate: dateStringSchema.nullable(),
```

`null` は**エラーではなく正常値**です。 250cc 以下のバイクなど車検制度の対象外の車両を表します（判定の詳細は `shaken-required.ts`）。 `.default()` を付けていないため、キー自体の省略は許しません。呼び出し側が「入れ忘れた」のか「意図的に無し」なのかを区別できるようにするためで、フォーム側は空文字を明示的に `null` へ変換して渡します。

日付は `dateStringSchema` により branded な `DateString` として扱われ、`Date` には変換しません。Cloudflare Workers は常に `TZ=UTC` で動くため、利用者の JST とのずれが日付を1日前後させる危険があるからです。

```ts
note: z
  .string()
  .trim()
  .max(NOTE_MAX_LENGTH, `備考は${NOTE_MAX_LENGTH}文字以内で入力してください`)
  .default(''),

export type VehicleInput = z.infer<typeof vehicleSchema>
```

備考も `modelCode` と同じく任意・空文字既定です。

`VehicleInput` はフォームの `initialValues`、サーバー関数の引数、テストのフィクスチャで共通に使われます。スキーマに項目を足せば型も自動的に追従するため、`modelCode` の追加時も型定義を別途書き足す必要はありませんでした。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/vehicles/lib/vehicle-schema.ts*
