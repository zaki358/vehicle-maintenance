# shaken-required.ts

`src/features/vehicles/lib/shaken-required.ts`

## 概要

ある車両に「車検UI」（満了日の表示、`shaken/lib` によるアラート、更新フォームなど）を出すべきかどうかを1つの関数で判定します。

250cc以下のバイクなど車検制度そのものが存在しない車両があり、そうした車両は登録時に満了日を設定しません（`shakenExpiryDate` が `null`）。この関数はその `null` の有無だけを見て判定します。車両区分（`vehicleType`）では判定しないのがポイントで、これは車のほうに満了日を設定するかどうかも含めて、最終的にはユーザーの入力が正なので、区分から自動で決め打ちしないようにするためです。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `shakenRequired` | function（export） | 満了日の有無から車検UI表示の要否を判定する |

## コード解説

```ts
export function shakenRequired(shakenExpiryDate: DateString | null): boolean {
  return shakenExpiryDate !== null
}
```

引数はただ1つ、満了日（`DateString`）または `null`。 `null` でなければ車検UIの対象、`null` なら対象外、というだけの単純な判定です。

処理としては1行ですが、あえて独立した関数として切り出しているのには理由があります。「満了日が `null` かどうか」というチェックを呼び出し側（コンポーネントやダッシュボードのロジック）にそのまま書かせると、コードを読んだときに「なぜ `null` チェックしているのか」が伝わりません。`shakenRequired(...)` という名前の関数にすることで、「これは250cc以下のバイクなど車検制度対象外の判定である」という意図が呼び出し側のコードだけで読み取れるようになります。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/vehicles/lib/shaken-required.ts*
