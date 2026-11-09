# vehicle-type.ts

`src/features/vehicles/lib/vehicle-type.ts`

## 概要

車両の「区分」（車かバイクか）を表す型と、それを画面に表示するための日本語ラベルへの変換関数をまとめた、ごく小さなファイルです。

車両区分はこのアプリの複数箇所（登録フォーム、一覧表示、車検対象かどうかの判定など）で使われるため、文字列リテラルを直接あちこちに書くのではなく、ここで型として一度だけ定義しています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `VehicleType` | type（export） | 車両区分: `'car'` または `'motorcycle'` |
| `vehicleTypeLabel` | function（export） | 車両区分から日本語ラベル（「車」「バイク」）を返す |

## コード解説

```ts
export type VehicleType = 'car' | 'motorcycle'
```

車と単車の2択を文字列リテラル型で表現しています。`enum` ではなくリテラルユニオンを使うのは、このプロジェクト全体の方針（`coding-style`）に合わせたものです。値が2つだけで今後も増える見込みが薄いため、シンプルな文字列のままで十分です。

```ts
export function vehicleTypeLabel(type: VehicleType): string {
  switch (type) {
    case 'car':
      return '車'
    case 'motorcycle':
      return 'バイク'
  }
}
```

画面表示用に日本語へ変換するだけの関数です。`switch` で `VehicleType` の全パターンを網羅しているため、将来 `VehicleType` に新しい値を追加した際は TypeScript が「網羅していない」というエラーで教えてくれます（各 `case` が値を返しているため、関数全体の戻り値の型チェックが漏れを検出します）。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/features/vehicles/lib/vehicle-type.ts*
