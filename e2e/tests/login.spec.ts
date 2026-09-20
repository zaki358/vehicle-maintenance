import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { loginViaUi } from '../support/auth'

/**
 * シナリオ1（優先度: 高）— ログイン。
 * 誤ったパスワードでは日本語のエラーメッセージが表示され、正しいパスワードでは
 * ダッシュボード（`/`）へ遷移することを確認する。
 */
test.describe('ログイン', () => {
  const admin = createAdminClient()
  let user: E2eTestUser

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'login')
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test('誤ったパスワードでは日本語のエラーメッセージが表示される', async ({ page }) => {
    await loginViaUi(page, user.email, 'wrong-password-x1')

    await expect(page.getByRole('alert')).toHaveText('メールアドレスまたはパスワードが正しくありません')
    await expect(page).toHaveURL(/\/login/)
  })

  test('正しいパスワードでダッシュボード(/)へ遷移する', async ({ page }) => {
    await loginViaUi(page, user.email, user.password)

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    await expect(page.getByText(`ログイン中: ${user.email}`)).toBeVisible()
  })
})
