import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'
import { gotoReady } from '../support/navigation'

/**
 * シナリオ4（優先度: 高）— 車検完了。
 *
 * `renewal.ts` の繰り越しルール（満了日の1ヶ月前以内の受検は「旧満了日+N年」）を
 * 意図せず発動させないよう、既存の満了日(currentExpiry)を受検日から
 * 十分離しておく（`isWithinCarryForwardWindow` が false になることを
 * 手計算で確認済み）。これにより新しい満了日は必ず「受検日+N年」になる。
 *
 * 例: currentExpiry=2027-01-01, completedOn=2026-10-15 の場合、
 *   oneMonthBeforeExpiry=addMonths(2027-01-01,-1)=2026-12-01
 *   completedOn(2026-10-15) は 2026-12-01 より前 → 繰り越し対象外
 *   → newExpiry = addYears(2026-10-15, 2) = 2028-10-15
 */
test.describe('車検完了', () => {
  const admin = createAdminClient()
  let user: E2eTestUser

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'shaken-renewal')
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, user.email, user.password)
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('+2年: 満了日が受検日から正確に2年後になり、work_type=shakenの記録が1件増える', async ({ page }) => {
    const vehicle = await seedVehicle(user.client, {
      name: '2年更新テスト車両',
      vehicleType: 'car',
      shakenExpiryDate: '2027-01-01',
    })

    await gotoReady(page, `/vehicles/${vehicle.id}/shaken`)
    await page.getByLabel('受検日').fill('2026-10-15')
    // 有効期間はデフォルトで2年のためそのまま送信する
    await page.getByRole('button', { name: '車検完了を記録' }).click()

    await expect(page).toHaveURL(`/vehicles/${vehicle.id}`)
    await expect(page.getByText(/車検満了日: 2028年10月15日/)).toBeVisible()
    await expect(page.getByText(/2026年10月15日/)).toBeVisible()

    const { data: updatedVehicle } = await user.client.from('vehicles').select().eq('id', vehicle.id).single()
    expect(updatedVehicle?.shaken_expiry_date).toBe('2028-10-15')

    const { data: records } = await user.client.from('maintenance_records').select().eq('vehicle_id', vehicle.id)
    expect(records).toHaveLength(1)
    expect(records?.[0].work_type).toBe('shaken')
    expect(records?.[0].performed_on).toBe('2026-10-15')
  })

  test('+3年: 満了日が受検日から正確に3年後になる', async ({ page }) => {
    const vehicle = await seedVehicle(user.client, {
      name: '3年更新テスト車両',
      vehicleType: 'car',
      shakenExpiryDate: '2027-06-01',
    })

    await gotoReady(page, `/vehicles/${vehicle.id}/shaken`)
    await page.getByLabel('受検日').fill('2026-10-15')
    await page.getByLabel('有効期間').selectOption('3')
    await page.getByRole('button', { name: '車検完了を記録' }).click()

    await expect(page).toHaveURL(`/vehicles/${vehicle.id}`)
    await expect(page.getByText(/車検満了日: 2029年10月15日/)).toBeVisible()

    const { data: updatedVehicle } = await user.client.from('vehicles').select().eq('id', vehicle.id).single()
    expect(updatedVehicle?.shaken_expiry_date).toBe('2029-10-15')

    const { data: records } = await user.client.from('maintenance_records').select().eq('vehicle_id', vehicle.id)
    expect(records).toHaveLength(1)
    expect(records?.[0].work_type).toBe('shaken')
  })
})
