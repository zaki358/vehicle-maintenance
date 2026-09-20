import { useState } from 'react'
import type { FormEvent } from 'react'

import { vehicleSchema } from './lib/vehicle-schema'
import type { VehicleInput } from './lib/vehicle-schema'
import { vehicleTypeLabel } from './lib/vehicle-type'
import type { VehicleType } from './lib/vehicle-type'

const VEHICLE_TYPES: VehicleType[] = ['car', 'motorcycle']

export type VehicleFormResult = { success: true } | { success: false; error: string }

interface VehicleFormProps {
  /** 編集時に渡す。未指定なら新規登録フォームとして空欄から始まる。 */
  initialValues?: VehicleInput
  submitLabel: string
  onSubmit: (input: VehicleInput) => Promise<VehicleFormResult>
}

/**
 * 車両の新規登録・編集で共用するフォーム。
 *
 * `<input type="date">` は未入力だと空文字列を返すが、`vehicleSchema` の
 * `shakenExpiryDate` は「実在する日付文字列 or `null`」しか受け付けない
 * （空文字列は弾かれる）。そのため送信時に空文字列を `null` へ変換してから
 * 検証にかける。250cc 以下のバイク等、車検満了日を持たない車両は
 * この変換によって自然に扱える。
 */
export function VehicleForm({ initialValues, submitLabel, onSubmit }: VehicleFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [modelCode, setModelCode] = useState(initialValues?.modelCode ?? '')
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialValues?.vehicleType ?? 'car')
  const [shakenExpiryDate, setShakenExpiryDate] = useState(initialValues?.shakenExpiryDate ?? '')
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
    <form onSubmit={handleSubmit} className="form-stack">
      <label className="field">
        <span className="field-label">車種名</span>
        <input className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="field">
        <label className="field-control">
          <span className="field-label">型式</span>
          <input className="field-input" value={modelCode} onChange={(event) => setModelCode(event.target.value)} />
        </label>
        <span className="field-hint">任意。例: ZC33S</span>
      </div>
      <div className="form-grid form-grid-2">
        <label className="field">
          <span className="field-label">車両区分</span>
          <select
            className="field-select"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value as VehicleType)}
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {vehicleTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <label className="field-control">
            <span className="field-label">車検満了日</span>
            <input
              type="date"
              className="field-input"
              value={shakenExpiryDate}
              onChange={(event) => setShakenExpiryDate(event.target.value)}
            />
          </label>
          <span className="field-hint">任意。250cc以下のバイクなど車検が無い車両は空欄</span>
        </div>
      </div>
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
