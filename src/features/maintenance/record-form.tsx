import { useState } from 'react'
import type { FormEvent } from 'react'

import type { DateString } from '@/lib/date/date-string'
import { isDateString } from '@/lib/date/date-string'
import { completeShakenSchema } from '@/features/shaken/lib/complete-shaken-schema'
import type { CompleteShakenInput } from '@/features/shaken/lib/complete-shaken-schema'
import { SHAKEN_VALID_YEARS, computeNextShakenExpiry } from '@/features/shaken/lib/renewal'
import type { ShakenValidYears } from '@/features/shaken/lib/renewal'
import { isOdometerRegression } from './lib/odometer'
import type { OdometerReading } from './lib/odometer'
import { recordSchema } from './lib/record-schema'
import type { RecordInput } from './lib/record-schema'
import { WORK_TYPES, isShakenWorkType, workTypeFields, workTypeLabel } from './lib/work-types'
import type { WorkType } from './lib/work-types'

export type RecordFormResult = { success: true } | { success: false; error: string }

const PART_DETAIL_SUGGESTIONS_ID = 'record-form-part-detail-suggestions'

interface ShakenRenewal {
  /** 更新前の満了日。まだ車検情報が無い車両なら null。 */
  currentExpiry: DateString | null
  onSubmit: (input: CompleteShakenInput) => Promise<RecordFormResult>
}

interface RecordFormProps {
  /** 編集時に渡す。未指定なら新規登録フォームとして空欄から始まる。 */
  initialValues?: RecordInput
  /** 作業内容を選んだ状態で開く（「車検完了を記録」からの遷移など）。 */
  initialWorkType?: WorkType
  submitLabel: string
  /** 部品型式欄のサジェスト候補（`part-suggestions.ts` で作成済みのもの）。 */
  partSuggestionsList: string[]
  /** 走行距離の逆行チェック対象。編集時は自分自身の記録を含めない。 */
  existingReadings: OdometerReading[]
  /**
   * 車検を選んだときに満了日の更新まで行う場合に渡す。
   * 渡さなければ車検も通常の記録として保存する（編集時は満了日を再更新しない）。
   */
  shakenRenewal?: ShakenRenewal
  onSubmit: (input: RecordInput) => Promise<RecordFormResult>
}

/**
 * 整備記録の登録・編集で共用するフォーム。
 *
 * 表示する入力欄は作業内容の区分によって変わる（`workTypeFields()` が唯一の定義）。
 * 区分を切り替えても入力値は保持する — 「部品交換」で書いた内容を「修理」に
 * 付け替えるような操作が自然に行えるため。その区分で使わない値は
 * `recordSchema` が保存前に落とすので、DB には持ち込まれない。
 *
 * 車検だけは保存先が異なる。整備記録の追加と車両の満了日更新を1トランザクションで
 * 行う必要があり、`complete_shaken` RPC 経由になるため `shakenRenewal.onSubmit`
 * へ回す（詳細は features/shaken/server/complete-shaken.ts）。
 *
 * 走行距離の逆行警告は `role="status"`（非緊急）にして `role="alert"` の
 * 入力検証エラーと区別している。矛盾があっても記録そのものは正当な場合がある
 * （例: 走行距離計を交換した）ため、送信をブロックしない。
 */
export function RecordForm({
  initialValues,
  initialWorkType,
  submitLabel,
  partSuggestionsList,
  existingReadings,
  shakenRenewal,
  onSubmit,
}: RecordFormProps) {
  const [performedOn, setPerformedOn] = useState(initialValues?.performedOn ?? '')
  const [workType, setWorkType] = useState<WorkType>(initialValues?.workType ?? initialWorkType ?? WORK_TYPES[0])
  const [detail, setDetail] = useState(initialValues?.detail ?? '')
  const [odometerKm, setOdometerKm] = useState(
    initialValues?.odometerKm != null ? String(initialValues.odometerKm) : '',
  )
  const [partDetail, setPartDetail] = useState(initialValues?.partDetail ?? '')
  const [oilType, setOilType] = useState(initialValues?.oilType ?? '')
  const [elementChanged, setElementChanged] = useState(initialValues?.elementChanged ?? false)
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [years, setYears] = useState<ShakenValidYears>(2)
  const [newExpiryDateOverride, setNewExpiryDateOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fields = workTypeFields(workType)
  const isShaken = isShakenWorkType(workType)
  const renewsExpiry = isShaken && shakenRenewal !== undefined
  const dateLabel = isShaken ? '車検日' : '実施日'

  /**
   * 新しい満了日は `computeNextShakenExpiry`（制度どおりの繰り越しルール）の
   * 計算値を表示しつつ、直接編集もできる。車検日・有効期間を変更すると
   * 手動修正は破棄する — 古い車検日に対する修正が新しい車検日に引き継がれて
   * 誤った満了日になるのを防ぐため。
   */
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

  const regressionWarning = computeRegressionWarning(performedOn, odometerKm, existingReadings)
  const parsedOdometerKm = odometerKm === '' ? null : Number(odometerKm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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

    setError(null)
    setSubmitting(true)
    try {
      const result = renewsExpiry
        ? await shakenRenewal.onSubmit(parsed.data as CompleteShakenInput)
        : await onSubmit(parsed.data as RecordInput)
      if (!result.success) {
        setError(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      <div className="form-grid form-grid-2">
        <label className="field">
          <span className="field-label">{dateLabel}</span>
          <input
            type="date"
            className="field-input"
            value={performedOn}
            onChange={(event) => handlePerformedOnChange(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">作業内容</span>
          <select
            className="field-select"
            value={workType}
            onChange={(event) => setWorkType(event.target.value as WorkType)}
          >
            {WORK_TYPES.map((type) => (
              <option key={type} value={type}>
                {workTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fields.detail !== 'hidden' && (
        <label className="field">
          <span className="field-label">{fields.detailLabel}</span>
          <input className="field-input" value={detail} onChange={(event) => setDetail(event.target.value)} />
        </label>
      )}

      {renewsExpiry && (
        <div className="form-grid form-grid-2">
          <label className="field">
            <span className="field-label">有効期間</span>
            <select className="field-select" value={years} onChange={(event) => handleYearsChange(event.target.value)}>
              {SHAKEN_VALID_YEARS.map((value) => (
                <option key={value} value={value}>
                  {value}年
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <label className="field-control">
              <span className="field-label">新しい満了日</span>
              <input
                type="date"
                className="field-input"
                value={newExpiryDate}
                onChange={(event) => setNewExpiryDateOverride(event.target.value)}
              />
            </label>
            <span className="field-hint">自動計算されています。必要であれば直接修正できます。</span>
          </div>
        </div>
      )}

      <div className="form-grid form-grid-2">
        <div className="field">
          <label className="field-control">
            <span className="field-label">走行距離</span>
            <input
              type="number"
              className="field-input"
              value={odometerKm}
              onChange={(event) => setOdometerKm(event.target.value)}
            />
          </label>
          <span className="field-hint">km・任意</span>
        </div>

        {fields.oilType && (
          <div className="field">
            <label className="field-control">
              <span className="field-label">油種</span>
              <input className="field-input" value={oilType} onChange={(event) => setOilType(event.target.value)} />
            </label>
            <span className="field-hint">任意。例: 0W-20</span>
          </div>
        )}

        {fields.partDetail !== 'hidden' && (
          <div className="field">
            <label className="field-control">
              <span className="field-label">部品型式</span>
              <input
                className="field-input"
                list={PART_DETAIL_SUGGESTIONS_ID}
                value={partDetail}
                onChange={(event) => setPartDetail(event.target.value)}
              />
            </label>
            {fields.partDetail === 'optional' && <span className="field-hint">任意</span>}
          </div>
        )}
      </div>

      {fields.elementChanged && (
        <label className="field-check">
          <input
            type="checkbox"
            checked={elementChanged}
            onChange={(event) => setElementChanged(event.target.checked)}
          />
          オイルエレメントも交換した
        </label>
      )}

      {regressionWarning && (
        <p role="status" className="notice">
          走行距離が他の記録と前後関係が逆になっています。ご確認ください。
        </p>
      )}

      <datalist id={PART_DETAIL_SUGGESTIONS_ID}>
        {partSuggestionsList.map((suggestion) => (
          <option key={suggestion} value={suggestion}>
            {suggestion}
          </option>
        ))}
      </datalist>

      <label className="field">
        <span className="field-label">備考</span>
        <textarea className="field-textarea" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <div className="btn-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitLabel}
        </button>
      </div>
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
