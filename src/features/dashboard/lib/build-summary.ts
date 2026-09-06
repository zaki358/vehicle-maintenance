import type { DateString } from '@/lib/date/date-string'
import type { ShakenAlertTier } from '@/features/shaken/lib/alert-tier'
import { shakenAlertTier } from '@/features/shaken/lib/alert-tier'
import type { VehicleType } from '@/features/vehicles/lib/vehicle-type'
import type { LastServiceInfo } from './since-last-service'
import { sinceLastService } from './since-last-service'

export type SummaryVehicle = {
  id: string
  name: string
  vehicleType: VehicleType
  shakenExpiryDate: DateString | null
}

export type SummaryRecord = {
  vehicleId: string
  performedOn: DateString
  odometerKm: number | null
}

export type VehicleSummary = {
  vehicleId: string
  name: string
  vehicleType: VehicleType
  shakenTier: ShakenAlertTier
  currentOdometerKm: number | null
  lastService: LastServiceInfo | null
}

export function buildVehicleSummary(
  vehicle: SummaryVehicle,
  records: readonly SummaryRecord[],
  today: DateString,
): VehicleSummary {
  const vehicleRecords = records.filter((record) => record.vehicleId === vehicle.id)
  const odometerReadings = vehicleRecords
    .map((record) => record.odometerKm)
    .filter((odometerKm): odometerKm is number => odometerKm !== null)

  return {
    vehicleId: vehicle.id,
    name: vehicle.name,
    vehicleType: vehicle.vehicleType,
    shakenTier: shakenAlertTier(vehicle.shakenExpiryDate, today),
    currentOdometerKm: odometerReadings.length === 0 ? null : Math.max(...odometerReadings),
    lastService: sinceLastService(vehicleRecords, today),
  }
}

export function buildVehicleSummaries(
  vehicles: readonly SummaryVehicle[],
  records: readonly SummaryRecord[],
  today: DateString,
): VehicleSummary[] {
  return vehicles.map((vehicle) => buildVehicleSummary(vehicle, records, today))
}
