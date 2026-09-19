import { useState } from 'react'
import type { FormEvent } from 'react'

import type { DateString } from '@/lib/date/date-string'
import { isDateString } from '@/lib/date/date-string'
import { completeShakenSchema } from './lib/complete-shaken-schema'
import type { CompleteShakenInput } from './lib/complete-shaken-schema'
import { SHAKEN_VALID_YEARS, computeNextShakenExpiry } from './lib/renewal'
import type { ShakenValidYears } from './lib/renewal'

export type ShakenFormResult = { success: true } | { success: false; error: string }

interface ShakenFormProps {
  /** 更新前の満了日。新規登録（初めて車検情報を設定する車両）なら null。 */
  currentExpiry: DateString | null
  submitLabel: string
  onSubmit: (input: CompleteShakenInput) => Promise<ShakenFormResult>
}

/**
 * 車検完了を記録するフォーム。
 *
 * 「新しい満了日」は `renewal.ts` の `computeNextShakenExpiry`
 * （制度どおりの繰り越しルール）で自動計算した値を表示しつつ、
 * 直接編集もできる（要件「計算結果を表示し手動修正も可」）。
 * 受検日・有効期間を変更すると手動修正は破棄され、その組み合わせでの
 * 計算結果に戻る — 「古い受検日に対する手動修正」が新しい受検日に
 * 引き継がれて誤った満了日になるのを防ぐため。
 */
export function ShakenForm({ currentExpiry, submitLabel, onSubmit }: ShakenFormProps) {
  const [performedOn, setPerformedOn] = useState('')
  const [years, setYears] = useState<ShakenValidYears>(2)
  const [newExpiryDateOverride, setNewExpiryDateOverride] = useState<string | null>(null)
  const [odometerKm, setOdometerKm] = useState('')
  const [partDetail, setPartDetail] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const computedExpiry = isDateString(performedOn)
    ? computeNextShakenExpiry({ completedOn: performedOn, currentExpiry, years })
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = completeShakenSchema.safeParse({
      performedOn,
      newExpiryDate,
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
        受検日
        <input
          type="date"
          value={performedOn}
          onChange={(event) => handlePerformedOnChange(event.target.value)}
        />
      </label>
      <label>
        有効期間
        <select value={years} onChange={(event) => handleYearsChange(event.target.value)}>
          {SHAKEN_VALID_YEARS.map((value) => (
            <option key={value} value={value}>
              {value}年
            </option>
          ))}
        </select>
      </label>
      <label>
        新しい満了日
        <input
          type="date"
          value={newExpiryDate}
          onChange={(event) => setNewExpiryDateOverride(event.target.value)}
        />
      </label>
      <p>自動計算されています。必要であれば直接修正できます。</p>
      <label>
        走行距離（km・任意）
        <input type="number" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} />
      </label>
      <label>
        部品/型式（任意）
        <input value={partDetail} onChange={(event) => setPartDetail(event.target.value)} />
      </label>
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
