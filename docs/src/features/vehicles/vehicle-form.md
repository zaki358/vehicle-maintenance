# vehicle-form.tsx

`src/features/vehicles/vehicle-form.tsx`

## 概要

車両の新規登録と編集で共用するフォームコンポーネントです。車種名・型式・車両区分・車検満了日・備考の5項目を入力し、 `vehicleSchema` で検証してから props の `onSubmit` に渡します。通信・保存は自分では行わないため、ルート側からも単体テストからも同じ形で使えます。

今回の変更で**型式（`modelCode`）の入力欄が追加**されました。車種名だけでは同名の別グレードを区別しづらいため、補足として任意入力できます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `VEHICLE_TYPES` | const（非export） | 選択肢に並べる車両区分の配列 |
| `VehicleFormResult` | type（export） | 送信結果。成功か、エラーメッセージ付きの失敗 |
| `VehicleFormProps` | interface（非export） | props 定義 |
| `VehicleForm` | component（export） | 本体 |

## コード解説

```tsx
const VEHICLE_TYPES: VehicleType[] = ['car', 'motorcycle']

export type VehicleFormResult = { success: true } | { success: false; error: string }

interface VehicleFormProps {
  /** 編集時に渡す。未指定なら新規登録フォームとして空欄から始まる。 */
  initialValues?: VehicleInput
  submitLabel: string
  onSubmit: (input: VehicleInput) => Promise<VehicleFormResult>
}
```

`initialValues` の有無だけで登録フォームと編集フォームを切り替えます。ボタンの文言は `submitLabel` で外から与えるため、コンポーネント側は「登録か編集か」を知る必要がありません。

`VehicleFormResult` は判別可能なユニオンです。例外を投げる代わりに値として失敗を返させることで、呼び出し側が必ず結果を見ることになり、エラーの握り潰しが起きにくくなります。

```tsx
const [name, setName] = useState(initialValues?.name ?? '')
const [modelCode, setModelCode] = useState(initialValues?.modelCode ?? '')
const [vehicleType, setVehicleType] = useState<VehicleType>(initialValues?.vehicleType ?? 'car')
const [shakenExpiryDate, setShakenExpiryDate] = useState(initialValues?.shakenExpiryDate ?? '')
const [note, setNote] = useState(initialValues?.note ?? '')
```

各欄を制御コンポーネントとして `useState` で保持します。 `modelCode` が今回追加された状態です。

`shakenExpiryDate` の初期値が `?? ''` になっているのは、 `<input type="date">` の `value` が文字列しか受け取れず、 `null` を渡すと React が非制御コンポーネントとして扱ってしまうためです。車検満了日を持たない車両（`null`）は空文字として表示します。

```tsx
const parsed = vehicleSchema.safeParse({
  name,
  modelCode,
  vehicleType,
  shakenExpiryDate: shakenExpiryDate === '' ? null : shakenExpiryDate,
  note,
})
if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? '入力内容を確認してください')
  return
}
```

**空文字から `null` への変換**がこの関数の要点です。 `<input type="date">` は未入力だと空文字列を返しますが、 `vehicleSchema` の `shakenExpiryDate` は「実在する日付文字列 または `null`」しか受け付けず、空文字は弾かれます。送信時にこの変換を挟むことで、250cc 以下のバイクなど車検満了日を持たない車両が自然に扱えます。

`modelCode` には同様の変換がありません。型式は `.default('')` の任意テキストで、未入力＝空文字がそのまま正しい値だからです。「未入力」の表現を `null` と空文字に二分させない、という DB 側と揃えた方針です。

`safeParse` で例外を投げずに最初のエラーメッセージを表示します。なお本当の検証はサーバー関数の入口で同じスキーマにより行われるため、ここでの検証はあくまで利用者への即時フィードバックです。

```tsx
<div className="field">
  <label className="field-control">
    <span className="field-label">型式</span>
    <input className="field-input" value={modelCode} onChange={...} />
  </label>
  <span className="field-hint">任意。例: ZC33S</span>
</div>
```

追加された型式の入力欄です。ヒント（`field-hint`）が `<label>` の外に置かれているのは、ラベルのクリック領域に補足文まで含めないためです。ヒントを出すために `<div className="field">` でくるみ、`<label>` を `field-control` に縮めるという構成は、車検満了日や走行距離など他のヒント付きの欄でも共通です。

「任意。例: ZC33S」と具体例を添えているのは、「型式」が何を指すのかが利用者によって解釈の分かれる語だからです。

```tsx
<select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType)}>
  {VEHICLE_TYPES.map((type) => (
    <option key={type} value={type}>{vehicleTypeLabel(type)}</option>
  ))}
</select>
```

`option` の `value` は DB に保存する識別子（`car` / `motorcycle`）、表示は `vehicleTypeLabel()` が返す日本語、という分離です。 `as VehicleType` のキャストは、`select` の `value` が DOM 上は `string` 型になるための橋渡しで、実際に不正な値が来ても `vehicleSchema` の `z.enum` が送信時に弾きます。

```tsx
<span className="field-hint">任意。250cc以下のバイクなど車検が無い車両は空欄</span>
...
{error && (
  <p role="alert" className="alert">{error}</p>
)}
<button type="submit" className="btn btn-primary" disabled={submitting}>
  {submitLabel}
</button>
```

車検満了日のヒントは「空欄でよい」ことを明示します。必須に見えて入力に困る、という迷いを消すためです。

エラーは `role="alert"` で、スクリーンリーダーに即座に読み上げられます。送信中は `disabled={submitting}` で二重送信を防ぎ、`finally` で必ず解除するため、失敗してもボタンが押せないまま固まることはありません。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/vehicles/vehicle-form.tsx*
