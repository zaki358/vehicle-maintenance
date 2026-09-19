import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'

/**
 * シナリオ8（優先度: 低。`mobile` プロジェクトのみ）— モバイル人間工学。
 * ダッシュボードから整備記録追加画面まで2タップで到達できること、
 * 375px幅で横スクロールが発生しないことを確認する。
 * `desktop` プロジェクトではモバイル特有の検証のため常にスキップする。
 */
test.describe('モバイル人間工学', () => {
  const admin = createAdminClient()
  let user: E2eTestUser
  const vehicleName = 'モバイル確認車両'

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'mobile-ux')
    await seedVehicle(user.client, { name: vehicleName, vehicleType: 'car' })
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'モバイル専用シナリオのため desktop プロジェクトではスキップ')
    await page.setViewportSize({ width: 375, height: 812 })
    await loginViaUi(page, user.email, user.password)
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('ダッシュボードから記録追加まで2タップで到達できる', async ({ page }) => {
    await page.getByRole('link', { name: vehicleName }).click() // タップ1: 車両詳細へ
    await page.getByRole('link', { name: '＋ 整備記録を追加' }).click() // タップ2: 記録追加へ
    await expect(page).toHaveURL(/\/records\/new$/)
    await expect(page.getByRole('heading', { name: `${vehicleName} の整備記録を追加` })).toBeVisible()
  })

  test('375px幅で横スクロールが発生しない(ダッシュボード・詳細・記録追加)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '車両メンテナンス記録' })).toBeVisible()
    expect(await hasHorizontalOverflow(page)).toBe(false)

    await page.getByRole('link', { name: vehicleName }).click()
    expect(await hasHorizontalOverflow(page)).toBe(false)

    await page.getByRole('link', { name: '＋ 整備記録を追加' }).click()
    expect(await hasHorizontalOverflow(page)).toBe(false)
  })
})

function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
}
