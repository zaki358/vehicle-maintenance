import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'
import { gotoReady } from '../support/navigation'

/**
 * シナリオ7（優先度: 中）— 整備記録。
 * 整備記録を追加すると一覧に反映され、部品/型式の入力が過去の入力値から
 * datalistでサジェストされ、作業内容フィルタが機能することを確認する。
 *
 * `getByLabel('作業内容', { exact: true })` は使わない。`<select>` を包む
 * `<label>` の text content には各 `<option>` の文字列も連結して含まれる
 * （例: "作業内容エンジンオイルオイルエレメントタイヤ..."）ため、`exact: true` は
 * "作業内容" 単体と一致せず永久にタイムアウトする（実機で再現・
 * `getByRole('combobox', ...)` や生CSSセレクタでは即座に成功することを確認して特定した）。
 * このページには "作業内容" を含むラベルが他に無いため、`exact` 無し
 * （部分一致）で曖昧さなく一意に絞り込める。
 */
test.describe('整備記録', () => {
  const admin = createAdminClient()
  let user: E2eTestUser
  let vehicleId: string
  const vehicleName = '整備記録テスト車両'

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'maintenance')
    const vehicle = await seedVehicle(user.client, { name: vehicleName, vehicleType: 'car' })
    vehicleId = vehicle.id
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, user.email, user.password)
    await page.waitForURL((url) => url.pathname === '/')
    await gotoReady(page, `/vehicles/${vehicleId}`)
  })

  test('記録を追加すると一覧に反映され、部品/型式がサジェストされ、作業内容フィルタが機能する', async ({
    page,
  }) => {
    await page.getByRole('link', { name: '＋ 整備記録を追加' }).click()
    await page.getByLabel('実施日').fill('2026-05-01')
    await page.getByLabel('作業内容').selectOption('engine_oil')
    await page.getByLabel('部品/型式').fill('純正オイルXYZ')
    await page.getByRole('button', { name: '登録' }).click()

    await expect(page).toHaveURL(`/vehicles/${vehicleId}`)
    await expect(page.getByText('純正オイルXYZ')).toBeVisible()

    // 2件目を登録する前に、1件目の部品/型式がdatalistでサジェストされることを確認する
    await page.getByRole('link', { name: '＋ 整備記録を追加' }).click()
    const suggestion = page.locator(
      'datalist#record-form-part-detail-suggestions option[value="純正オイルXYZ"]',
    )
    await expect(suggestion).toHaveCount(1)

    await page.getByLabel('実施日').fill('2026-06-01')
    await page.getByLabel('作業内容').selectOption('tire')
    await page.getByLabel('部品/型式').fill('タイヤABC')
    await page.getByRole('button', { name: '登録' }).click()

    await expect(page).toHaveURL(`/vehicles/${vehicleId}`)
    await expect(page.getByText('純正オイルXYZ')).toBeVisible()
    await expect(page.getByText('タイヤABC')).toBeVisible()

    // 作業内容フィルタ: タイヤだけに絞り込む
    await page.getByLabel('作業内容で絞り込み').selectOption('tire')
    await expect(page.getByText('タイヤABC')).toBeVisible()
    await expect(page.getByText('純正オイルXYZ')).toHaveCount(0)

    // フィルタを解除するとどちらも表示される
    await page.getByLabel('作業内容で絞り込み').selectOption('all')
    await expect(page.getByText('純正オイルXYZ')).toBeVisible()
    await expect(page.getByText('タイヤABC')).toBeVisible()
  })
})
