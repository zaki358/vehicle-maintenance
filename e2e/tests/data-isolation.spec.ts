import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'
import { gotoReady } from '../support/navigation'

/**
 * シナリオ5（優先度: 高）— データ分離。
 * ユーザーBがユーザーAの車両詳細URLを直接叩いても、`.maybeSingle()` により
 * 「存在しない」と「他人の車両(RLSでブロック)」が区別されず、同じ
 * notFoundComponent（404相当）が表示されることを確認する
 * （`_authed.vehicles.$vehicleId.tsx` 参照）。
 */
test.describe('データ分離', () => {
  const admin = createAdminClient()
  let userA: E2eTestUser
  let userB: E2eTestUser
  let vehicleAId: string

  test.beforeAll(async () => {
    userA = await createTestUser(admin, 'isolation-a')
    userB = await createTestUser(admin, 'isolation-b')
    const vehicle = await seedVehicle(userA.client, {
      name: 'Aさんの車',
      vehicleType: 'car',
    })
    vehicleAId = vehicle.id
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, userA.id)
    await deleteTestUser(admin, userB.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, userB.email, userB.password)
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('Bさんの車両一覧にAさんの車両は出ない', async ({ page }) => {
    await gotoReady(page, '/vehicles')
    await expect(page.getByText('登録された車両はまだありません。')).toBeVisible()
  })

  test('BさんがAさんの車両詳細URLへ直接アクセスすると404相当になる(存在有無を区別しない)', async ({ page }) => {
    await gotoReady(page, `/vehicles/${vehicleAId}`)
    await expect(page.getByRole('heading', { name: '車両が見つかりません' })).toBeVisible()
    await expect(page.getByText('指定された車両は存在しないか、閲覧できません。')).toBeVisible()
    // Aさんの車両名などの情報が一切漏れていないことを確認する
    await expect(page.getByText('Aさんの車')).toHaveCount(0)
  })
})
