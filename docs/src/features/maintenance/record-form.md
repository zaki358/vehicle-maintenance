# record-form.tsx

`src/features/maintenance/record-form.tsx`

## 概要

整備記録の登録と編集で共用するフォームコンポーネントです。表示する入力欄は選んだ作業内容の区分によって変わり、その判断は `workTypeFields()`（`lib/work-types.ts`）が唯一の情報源です。

以前は車検の記録だけ独立した画面（`complete-shaken-form.tsx` と `/vehicles/$vehicleId/shaken` ルート）に分かれていましたが、現在は **このフォームの中で作業内容として「車検」を選ぶ**形に統合されました。車検を選ぶと有効期間と新しい満了日の欄が現れ、送信先が `complete_shaken` RPC に切り替わります。

保存・通信は自分では行わず、すべて props の `onSubmit` / `shakenRenewal.onSubmit` に委ねます。データ取得層を持たない純粋な表示・入力コンポーネントなので、テストからも直接呼べます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `RecordFormResult` | type（export） | 送信結果。成功か、エラーメッセージ付きの失敗 |
| `PART_DETAIL_SUGGESTIONS_ID` | const（非export） | 部品型式欄の `datalist` の id |
| `ShakenRenewal` | interface（非export） | 満了日更新を伴う保存のための props（現在の満了日と送信関数） |
| `RecordFormProps` | interface（非export） | フォームの props 定義 |
| `RecordForm` | component（export） | 本体 |
| `computeRegressionWarning` | function（非export） | 走行距離の逆行警告を出すかどうかの判定 |

## コード解説

```tsx
interface ShakenRenewal {
  /** 更新前の満了日。まだ車検情報が無い車両なら null。 */
  currentExpiry: DateString | null
  onSubmit: (input: CompleteShakenInput) => Promise<RecordFormResult>
}

interface RecordFormProps {
  initialValues?: RecordInput
  initialWorkType?: WorkType
  submitLabel: string
  partSuggestionsList: string[]
  existingReadings: OdometerReading[]
  shakenRenewal?: ShakenRenewal
  onSubmit: (input: RecordInput) => Promise<RecordFormResult>
}
```

`initialValues` を渡せば編集フォーム、渡さなければ新規登録フォームになります。`initialWorkType` は「車検完了を記録」ボタンなどから、区分を選んだ状態でフォームを開くための入口です。

**`shakenRenewal` が省略可能なのが設計の要点**です。新規登録では渡され、車検を選ぶと満了日の更新まで行います。編集画面では渡さないので、車検の記録を編集しても車両の満了日は再更新されません。過去の記録を直しただけで現在の満了日が巻き戻る、という事故を「props を渡さない」という形で構造的に防いでいます。

`existingReadings` は走行距離の逆行チェック用の他の記録です。編集時は自分自身を除いたものが渡されます（自分と比較して常に警告が出るのを避けるため）。

```tsx
const [workType, setWorkType] = useState<WorkType>(
  initialValues?.workType ?? initialWorkType ?? WORK_TYPES[0])
const [detail, setDetail] = useState(initialValues?.detail ?? '')
const [oilType, setOilType] = useState(initialValues?.oilType ?? '')
const [elementChanged, setElementChanged] = useState(initialValues?.elementChanged ?? false)
...
const fields = workTypeFields(workType)
const isShaken = isShakenWorkType(workType)
const renewsExpiry = isShaken && shakenRenewal !== undefined
const dateLabel = isShaken ? '車検日' : '実施日'
```

入力値はすべて非制御ではなく `useState` による制御コンポーネントです。初期値の優先順位は `initialValues`（編集）→ `initialWorkType`（遷移時の指定）→ `WORK_TYPES[0]` （エンジンオイル）です。

`fields` は毎レンダリングで `workTypeFields(workType)` を呼び直して得ます。純粋関数で `switch` するだけなのでメモ化は不要です。これ以降の JSX はすべて `fields` を見て欄を出し分けます。

`renewsExpiry` は「車検を選んでいて、かつ満了日更新を任されている」ときだけ真になります。この1つの真偽値が、追加の入力欄の表示・検証スキーマの選択・送信先の切り替えという3つの分岐すべてを制御します。

**区分を切り替えても入力値は保持する**方針です。「部品交換」で書いた内容を「修理」に付け替える操作が自然に行えるようにするためで、使わない値は `recordSchema` の `transform` が保存前に落とすので DB には持ち込まれません。

```tsx
const computedExpiry =
  renewsExpiry && isDateString(performedOn)
    ? computeNextShakenExpiry({
        completedOn: performedOn,
        currentExpiry: shakenRenewal.currentExpiry,
        years,
      })
    : null
const newExpiryDate = newExpiryDateOverride ?? computedExpiry ?? ''

function handlePerformedOnChange(value: string) {
  setPerformedOn(value)
  setNewExpiryDateOverride(null)
}

function handleYearsChange(value: string) {
  setYears(Number(value) as ShakenValidYears)
  setNewExpiryDateOverride(null)
}
```

新しい満了日は「計算値を表示しつつ、直接編集もできる」という二面性のある値です。`newExpiryDateOverride` が `null` の間は `computeNextShakenExpiry`（制度どおりの繰り越しルール）の計算結果が表示され、利用者が日付欄を直接触ると手動値が優先されます。

**車検日や有効期間を変えたら手動修正を破棄する**のが重要な点です。破棄しないと、古い車検日に対して行った修正が新しい車検日にそのまま引き継がれ、誤った満了日が保存されてしまいます。そのために `setPerformedOn` / `setYears` を直接 `onChange` に渡さず、`handlePerformedOnChange` / `handleYearsChange` を経由させています。

```tsx
const parsed = renewsExpiry
  ? completeShakenSchema.safeParse({
      performedOn,
      newExpiryDate,
      odometerKm: parsedOdometerKm,
      note,
    })
  : recordSchema.safeParse({
      performedOn,
      workType,
      detail,
      odometerKm: parsedOdometerKm,
      partDetail,
      oilType,
      elementChanged,
      note,
    })
if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? '入力内容を確認してください')
  return
}
```

送信時、**検証スキーマ自体が切り替わります**。車検で満了日を更新する場合は `completeShakenSchema`（作業日・新しい満了日・走行距離・備考）、それ以外は `recordSchema` です。車検の行は `detail` も `part_detail` も使わないため、送る項目自体が異なります。

`safeParse` を使い、失敗しても例外を投げずに最初のエラーメッセージを表示します。ここでの検証はあくまで利用者への即時フィードバックであり、**本当の検証はサーバー関数の入口**（同じスキーマを `.validator()` に渡している）で行われます。

```tsx
const result = renewsExpiry
  ? await shakenRenewal.onSubmit(parsed.data as CompleteShakenInput)
  : await onSubmit(parsed.data as RecordInput)
if (!result.success) {
  setError(result.error)
}
```

送信先の切り替えです。車検は整備記録の追加と車両の満了日更新を **1トランザクション**で行う必要があるため、通常の `createRecordFn` ではなく `complete_shaken` RPC を呼ぶ `shakenRenewal.onSubmit` へ回します。片方だけ成功して「記録はあるのに満了日が古いまま」という状態を作らないためです（詳細は `features/shaken/server/complete-shaken.ts`）。

`finally` で `setSubmitting(false)` しているため、失敗しても送信ボタンが押せないまま固まることはありません。

```tsx
{fields.detail !== 'hidden' && (
  <label className="field">
    <span className="field-label">{fields.detailLabel}</span>
    <input className="field-input" value={detail} onChange={...} />
  </label>
)}
```

`detail` 欄の見出しは固定文字列ではなく `fields.detailLabel` です。区分によって「交換箇所」「交換内容」「修理内容」「調整内容」「チューニング内容」「改造内容」「作業内容」と変わり、エンジンオイルと車検では欄自体が消えます。必須エラーの文言も `recordSchema` が同じラベルから組み立てるため、画面の見出しとエラー文が必ず一致します。

```tsx
{renewsExpiry && (
  <div className="form-grid form-grid-2">
    <label className="field">
      <span className="field-label">有効期間</span>
      <select value={years} onChange={...}>
        {SHAKEN_VALID_YEARS.map((value) => (
          <option key={value} value={value}>{value}年</option>
        ))}
      </select>
    </label>
    <div className="field">
      ...新しい満了日の input...
      <span className="field-hint">自動計算されています。必要であれば直接修正できます。</span>
    </div>
  </div>
)}
```

削除された専用ページから移ってきた部分です。車検を選び、かつ `shakenRenewal` が渡されているときだけ現れます。 `field-hint` で「自動計算だが直せる」ことを明示しているのは、勝手に入った日付を利用者が不審に思わないようにするためです。

```tsx
{fields.oilType && ( ...油種の入力欄... )}

{fields.partDetail !== 'hidden' && (
  <input list={PART_DETAIL_SUGGESTIONS_ID} value={partDetail} ... />
  {fields.partDetail === 'optional' && <span className="field-hint">任意</span>}
)}

{fields.elementChanged && (
  <label className="field-check">
    <input type="checkbox" checked={elementChanged} ... />
    オイルエレメントも交換した
  </label>
)}
```

区分ごとに出し分ける残りの欄です。油種はエンジンオイルと油脂類交換で、エレメント交換のチェックボックスはエンジンオイルでのみ表示されます。

部品型式は `required` と `optional` の両方で表示され、 `optional` のときだけ「任意」のヒントを添えます。必須の場合（部品交換）にヒントを出さないことで、逆に必須であることが伝わります。

`list` 属性と `datalist` による入力補完で、過去に登録した部品型式を再入力せずに選べます（候補は `part-suggestions.ts` が作成済みのものを props で受け取ります）。 `datalist` は候補を提示するだけで、それ以外の値も自由に入力できます。

```tsx
{regressionWarning && (
  <p role="status" className="notice">
    走行距離が他の記録と前後関係が逆になっています。ご確認ください。
  </p>
)}

{error && (
  <p role="alert" className="alert">{error}</p>
)}
```

**警告とエラーで ARIA ロールを使い分けています。** 走行距離の逆行は `role="status"`（非緊急・読み上げを割り込ませない）、入力検証エラーは `role="alert"`（緊急・即座に読み上げる）です。

逆行警告は**送信をブロックしません**。走行距離計を交換した場合など、矛盾していても記録そのものは正当なことがあるためです。「間違いかもしれないので確認してほしい」という位置づけを、ロールの選択と送信を止めない挙動の両方で表しています。

```tsx
function computeRegressionWarning(
  performedOn: string,
  odometerKm: string,
  existingReadings: OdometerReading[],
): boolean {
  if (!isDateString(performedOn) || odometerKm === '') {
    return false
  }
  const parsedOdometerKm = Number(odometerKm)
  if (Number.isNaN(parsedOdometerKm)) {
    return false
  }
  return isOdometerRegression({ performedOn, odometerKm: parsedOdometerKm }, existingReadings)
}
```

入力途中の不完全な値（日付が未入力、走行距離が空や数値でない）では警告を出さないためのガードです。判定ロジック自体は純粋関数の `isOdometerRegression`（`lib/odometer.ts`）にあり、ここは「文字列の入力状態を判定可能な形に整える」役だけを担います。

コンポーネント本体の外に出すことで、レンダリング関数が短く保たれ、条件の抜けも読み取りやすくなっています。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/features/maintenance/record-form.tsx*
