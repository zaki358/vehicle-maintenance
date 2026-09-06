/** 車両区分。車検制度上の扱いが異なる（詳細は shaken-required.ts）。 */
export type VehicleType = 'car' | 'motorcycle'

/** 画面表示用の日本語ラベル。 */
export function vehicleTypeLabel(type: VehicleType): string {
  switch (type) {
    case 'car':
      return '車'
    case 'motorcycle':
      return 'バイク'
  }
}
