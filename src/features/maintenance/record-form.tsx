import { useState } from 'react'
import type { FormEvent } from 'react'

import { isDateString } from '@/lib/date/date-string'
import { isOdometerRegression } from './lib/odometer'
import type { OdometerReading } from './lib/odometer'
import { recordSchema } from './lib/record-schema'
import type { RecordInput } from './lib/record-schema'
import { WORK_TYPES, isOtherWorkType, workTypeLabel } from './lib/work-types'
import type { WorkType } from './lib/work-types'

export type RecordFormResult = { success: true } | { success: false; error: string }

const PART_DETAIL_SUGGESTIONS_ID = 'record-form-part-detail-suggestions'

interface RecordFormProps {
  /** 編集時に渡す。未指定なら新規登録フォームとして空欄から始まる。 */
  initialValues?: RecordInput
  submitLabel: string
  /** 部品/型式欄のサジェスト候補（`part-suggestions.ts` で作成済みのもの）。 */
  partSuggestionsList: string[]
  /** 走行距離の逆行チェック対象。編集時は自分自身の記録を含めない。 */
  existingReadings: OdometerReading[]
  onSubmit: (input: RecordInput) => Promise<RecordFormResult>
}

/**
 * 整備記録の登録・編集で共用するフォーム。
 *
 * 走行距離の逆行警告は `role="status"`（非緊急）にして `role="alert"` の
 * 入力検証エラーと区別している。矛盾があっても記録そのものは正当な場合がある
 * （例: 走行距離計を交換した）ため、送信をブロックしない。
 */
export function RecordForm({
  initialValues,
  submitLabel,
  partSuggestionsList,
  existingReadings,
  onSubmit,
}: RecordFormProps) {
  const [performedOn, setPerformedOn] = useState(initialValues?.performedOn ?? '')
  const [workType, setWorkType] = useState<WorkType>(initialValues?.workType ?? WORK_TYPES[0])
  const [workTypeOther, setWorkTypeOther] = useState(initialValues?.workTypeOther ?? '')
  const [odometerKm, setOdometerKm] = useState(
    initialValues?.odometerKm != null ? String(initialValues.odometerKm) : '',
  )
  const [partDetail, setPartDetail] = useState(initialValues?.partDetail ?? '')
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleWorkTypeChange(next: WorkType) {
    setWorkType(next)
    if (!isOtherWorkType(next)) {
      setWorkTypeOther('')
    }
  }

  const regressionWarning = computeRegressionWarning(performedOn, odometerKm, existingReadings)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = recordSchema.safeParse({
      performedOn,
      workType,
      workTypeOther,
      odometerKm: odometerKm === '' ? null : Number(odometerKm),
      partDetail,
      note,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '入力内容を確認してください')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const result = await onSubmit(parsed.data)
      if (!result.success) {
        setError(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        実施日
        <input type="date" value={performedOn} onChange={(event) => setPerformedOn(event.target.value)} />
      </label>
      <label>
        作業内容
        <select value={workType} onChange={(event) => handleWorkTypeChange(event.target.value as WorkType)}>
          {WORK_TYPES.map((type) => (
            <option key={type} value={type}>
              {workTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      {isOtherWorkType(workType) && (
        <label>
          作業内容（自由入力）
          <input value={workTypeOther} onChange={(event) => setWorkTypeOther(event.target.value)} />
        </label>
      )}
      <label>
        走行距離（km・任意）
        <input type="number" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} />
      </label>
      {regressionWarning && <p role="status">走行距離が他の記録と前後関係が逆になっています。ご確認ください。</p>}
      <label>
        部品/型式
        <input
          list={PART_DETAIL_SUGGESTIONS_ID}
          value={partDetail}
          onChange={(event) => setPartDetail(event.target.value)}
        />
      </label>
      <datalist id={PART_DETAIL_SUGGESTIONS_ID}>
        {partSuggestionsList.map((suggestion) => (
          <option key={suggestion} value={suggestion}>
            {suggestion}
          </option>
        ))}
      </datalist>
      <label>
        備考
        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  )
}

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
