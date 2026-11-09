# work-types.ts

`src/features/maintenance/lib/work-types.ts`

## 概要

整備記録の「作業内容」の区分（DB の `work_type` 列に保存する値）と、区分ごとに**どの入力欄を出すか・必須か**を定義する純粋モジュールです。 React も Supabase も import しないため、フォーム・Zod スキーマ・テストのどこからでも同じ定義を参照できます。

旧版の区分は `engine_oil` / `oil_element` / `tire` / `brake_pad` / `battery` / `shaken` / `other` と、 **「何を交換したか」を区分名そのもの**で表していました。この形は対象部品が増えるたびに区分を増やさなければならず、自由入力の `work_type_other` 列も必要でした。現在の9区分は **「どういう作業か」**で分け、具体的な対象は `detail` 列に書きます。これで区分を増やさずに任意の整備を記録できます。

このファイルの中心は `workTypeFields()` です。フォームが描画する欄と `recordSchema` が必須にする項目が**同じ1か所**を読むため、「画面には出ていないのに検証で必須にされる」といったずれが構造的に起きません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `WORK_TYPES` | const（export） | 作業内容9区分の識別子。`as const` のタプル |
| `WorkType` | type（export） | `WORK_TYPES` の要素のユニオン型 |
| `FieldRequirement` | type（export） | 入力欄の扱い（`'required'` / `'optional'` / `'hidden'`） |
| `WorkTypeFields` | interface（export） | 1区分あたりの入力欄の構成を表す |
| `workTypeLabel` | function（export） | 区分 → 画面表示用の日本語ラベル |
| `HIDDEN_DETAIL` | const（非export） | `detail` 欄を使わない区分のための共通断片 |
| `workTypeFields` | function（export） | 区分 → 使う入力欄と必須性。**唯一の情報源** |
| `isShakenWorkType` | function（export） | 車検かどうか（保存経路の分岐に使う） |

## コード解説

```ts
export const WORK_TYPES = [
  'engine_oil',
  'fluid',
  'part',
  'repair',
  'adjust',
  'tuning',
  'modification',
  'shaken',
  'other',
] as const

export type WorkType = (typeof WORK_TYPES)[number]
```

9区分は「エンジンオイル / 油脂類交換 / 部品交換 / 修理 / 調整 / チューニング / 改造 / 車検 / その他」です。`as const` を付けることで配列が読み取り専用のタプル型になり、`(typeof WORK_TYPES)[number]` からリテラルのユニオン型 `WorkType` が導出されます。値の一覧（`select` の選択肢や `z.enum()` に渡すもの）と型が必ず一致し、区分を追加すると `workTypeLabel` / `workTypeFields` の `switch` が網羅性チェックでコンパイルエラーになるため、対応漏れがビルド時に見つかります。

並び順はそのままフォームの選択肢の並びになります。`WORK_TYPES[0]` （`engine_oil`）が新規登録時の初期値です。

```ts
export type FieldRequirement = 'required' | 'optional' | 'hidden'

export interface WorkTypeFields {
  detail: FieldRequirement
  detailLabel: string
  partDetail: FieldRequirement
  oilType: boolean
  elementChanged: boolean
}
```

`detail` と `partDetail` は3状態（必須・任意・その区分では使わない）を取るため `FieldRequirement` で表します。一方 `oilType`（油種）と `elementChanged` （オイルエレメント同時交換）は、使う区分では常に任意入力なので「出すか出さないか」の真偽値で足ります。

`detailLabel` が型に含まれているのが要点です。`detail` 列は区分によって意味が変わる（部品交換なら「交換内容」、修理なら「修理内容」、油脂類交換なら「交換箇所」）ため、画面ラベルを固定にできません。画面の見出しも、必須エラーの文言（`recordSchema` が「〜を入力してください」として組み立てる）も、すべてここから取ります。

```ts
export function workTypeLabel(type: WorkType): string {
  switch (type) {
    case 'engine_oil':
      return 'エンジンオイル'
    case 'fluid':
      return '油脂類交換'
    ...
    case 'other':
      return 'その他'
  }
}
```

DB に保存する識別子は英語（スキーマの安定性のため）、画面に出すのは日本語、という分離をこの関数が担います。`default` 節を置かずに全ケースを書き切っているため、区分を増やして `case` を書き忘れると「戻り値に `undefined` が混じる」として型エラーになります。意図的に網羅性チェックを効かせた書き方です。

```ts
const HIDDEN_DETAIL = { detail: 'hidden', detailLabel: '' } as const
```

`detail` 欄を使わない区分（`engine_oil` と `shaken`）で使い回す断片です。`detail: 'hidden'` のときは `detailLabel` を空文字にする、という決まりを1か所に固定しています。

```ts
export function workTypeFields(type: WorkType): WorkTypeFields {
  switch (type) {
    case 'engine_oil':
      return { ...HIDDEN_DETAIL, partDetail: 'hidden', oilType: true, elementChanged: true }
    case 'fluid':
      return {
        detail: 'required',
        detailLabel: '交換箇所',
        partDetail: 'hidden',
        oilType: true,
        elementChanged: false,
      }
    case 'part':
      return {
        detail: 'required',
        detailLabel: '交換内容',
        partDetail: 'required',
        oilType: false,
        elementChanged: false,
      }
    ...
    case 'shaken':
      return { ...HIDDEN_DETAIL, partDetail: 'hidden', oilType: false, elementChanged: false }
    case 'other':
      return {
        detail: 'required',
        detailLabel: '作業内容',
        partDetail: 'optional',
        oilType: false,
        elementChanged: false,
      }
  }
}
```

**このファイルの核心**です。区分ごとの入力欄構成をまとめると次のようになります（「―」はその区分では使わない欄）。

| 区分 | detail | part\_detail | oil\_type | element\_changed |
| --- | --- | --- | --- | --- |
| エンジンオイル（engine\_oil） | ― | ― | 使う | 使う |
| 油脂類交換（fluid） | 必須「交換箇所」 | ― | 使う | ― |
| 部品交換（part） | 必須「交換内容」 | 必須 | ― | ― |
| 修理（repair） | 必須「修理内容」 | 任意 | ― | ― |
| 調整（adjust） | 必須「調整内容」 | ― | ― | ― |
| チューニング（tuning） | 必須「チューニング内容」 | 任意 | ― | ― |
| 改造（modification） | 必須「改造内容」 | 任意 | ― | ― |
| 車検（shaken） | ― | ― | ― | ― |
| その他（other） | 必須「作業内容」 | 任意 | ― | ― |

なお `performedOn`（作業日）・`odometerKm`（走行距離）・ `note`（備考）は全区分共通のため、この関数は扱いません。

**なぜ `engine_oil` と `shaken` だけ `detail` が不要か** — この2つは区分名そのものが作業内容を表しているためです。エンジンオイルなら油種とエレメント交換の有無、車検なら走行距離と備考があれば記録として成立します。

**なぜ `part` だけ部品型式が必須か** — 部品交換は「どの部品を入れたか」が記録の核だからです。修理・チューニング・改造・その他では、部品を伴わない作業もありうるので任意にしています。

**DB 側の制約と対応している** — この表の必須・不要の別は `20260920110100_rework_maintenance_work_types.sql` の `maintenance_records_detail_required` と `maintenance_records_part_detail_required` の CHECK 制約と同じ内容です。画面・サーバー関数入口の Zod・DB の3層で同じルールを守る形になっており、どこを迂回されても不正な行は入りません。

```ts
export function isShakenWorkType(type: WorkType): boolean {
  return type === 'shaken'
}
```

車検の記録は**保存経路が他と違う**ため、判定を関数として切り出しています。整備記録の `insert` と車両の `shaken_expiry_date` 更新を1トランザクションで行う必要があり、通常の `createRecordFn` ではなく `complete_shaken` RPC を通します（`features/shaken/server/complete-shaken.ts`）。 `record-form.tsx` がこの関数で分岐し、日付欄のラベルを「実施日」から「車検日」に変え、有効期間と新しい満了日の入力欄を出します。

`type === 'shaken'` をその場に書かずに関数化しているのは、呼び出し側の意図（「車検という特別扱いが必要な区分か」）を名前で示すためと、将来この条件が変わったときの変更点を1か所に閉じ込めるためです。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/maintenance/lib/work-types.ts*
