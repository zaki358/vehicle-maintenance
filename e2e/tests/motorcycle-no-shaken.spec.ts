import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'

/**
 * シナリオ6（優先度: 中）— 250ccバイク（車検対象外）。
 * `shaken_expiry_date` が無い車両（`shakenRequired` が false）では、
 * ダッシュボード・詳細ページのどちらにも車検UI/アラートが一切出ないことを確認する。
 */
test.describe('250ccバイク(車検対象外)', () => {
  const admin = createAdminClient()
  let user: E2eTestUser
  const vehicleName = 'カブ90'

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'no-shaken')
    await seedVehicle(user.client, {
      name: vehicleName,
      vehicleType: 'motorcycle',
      shakenExpiryDate: null,
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, user.email, user.password)
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('ダッシュボードに車検UIが一切出ない', async ({ page }) => {
    const item = page.locator('li', { hasText: vehicleName })
    await expect(item).toBeVisible()
    await expect(item.getByRole('alert')).toHaveCount(0)
    await expect(item.getByRole('status')).toHaveCount(0)
    await expect(item.getByRole('link', { name: '車検完了を記録' })).toHaveCount(0)
  })

  test('詳細ページに車検UIが一切出ない', async ({ page }) => {
    await page.getByRole('link', { name: vehicleName }).click()
    await expect(page.getByText('車検対象外')).toBeVisible()
    await expect(page.getByRole('link', { name: '車検完了を記録' })).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})
