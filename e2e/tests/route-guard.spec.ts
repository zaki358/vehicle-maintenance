import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { gotoReady } from '../support/navigation'

/**
 * シナリオ2（優先度: 高）— ルートガード。
 * 未ログインで `/vehicles` にアクセスすると `/login` へリダイレクトされ、
 * ログイン後は `/`（ダッシュボード）ではなく元々アクセスしようとした
 * `/vehicles` へ戻ることを確認する（`requireUser`/`_authed.tsx` の redirect search を検証）。
 */
test.describe('ルートガード', () => {
  const admin = createAdminClient()
  let user: E2eTestUser

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'route-guard')
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test('未ログインで/vehiclesへアクセスすると/loginへredirect検索パラメータ付きでリダイレクトされる', async ({
    page,
  }) => {
    await gotoReady(page, '/vehicles')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
  })

  test('ログイン後、ダッシュボードではなく元々アクセスしようとした/vehiclesへ戻る', async ({ page }) => {
    await gotoReady(page, '/vehicles')
    await expect(page).toHaveURL(/\/login\?redirect=/)

    await page.getByLabel('メールアドレス').fill(user.email)
    await page.getByLabel('パスワード').fill(user.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    await expect(page).toHaveURL('/vehicles')
    await expect(page.getByRole('heading', { name: '車両一覧' })).toBeVisible()
  })
})
