import { expect, test } from '@playwright/test'

import { createAdminClient, createTestUser, deleteTestUser } from '../support/supabase-admin'
import type { E2eTestUser } from '../support/supabase-admin'
import { seedVehicle } from '../support/seed'
import { loginViaUi } from '../support/auth'

/**
 * シナリオ3（優先度: 高）— 車検アラート。
 *
 * `alert-tier.ts` は「暦月」で警告(残り2ヶ月以内)/危険(残り1ヶ月以内)を判定するため、
 * テスト実行日からの相対日数でシードすると閾値付近で日をまたいでフレーキーになる。
 * そのため `page.clock.setFixedTime` でブラウザの「今日」を固定し、
 * 固定した基準日から算出した満了日をシードする。
 *
 * 基準日 2026-10-01(JST) に対して:
 *   - 満了日 2026-11-25（55日後）→ addMonths(expiry,-2)=2026-09-25 以降 かつ
 *     addMonths(expiry,-1)=2026-10-25 より前 → 警告(warning)
 *   - 満了日 2026-10-21（20日後）→ addMonths(expiry,-1)=2026-09-21 以降 → 危険(danger)
 * （`src/features/shaken/lib/alert-tier.ts` の判定式で手計算済み）
 *
 * `setFixedTime` はブラウザの `Date` だけを固定し、`setTimeout` 等は
 * フェイクにしないため、Reactのレンダリングやルーターのタイマーに干渉しない。
 * ただし固定はブラウザ(クライアントJS)側にのみ効くため、SSRを伴う
 * フルページ読み込み（`page.goto`）を挟むとサーバーの実時刻で再計算されてしまう。
 * このテストでは、日付非依存のログイン画面への `goto` だけをフルページ遷移にし、
 * それ以降はリンククリック/戻る操作によるSPA内クライアント遷移のみで移動する。
 */
const FIXED_NOW = new Date('2026-10-01T12:00:00+09:00')
const WARNING_EXPIRY = '2026-11-25'
const DANGER_EXPIRY = '2026-10-21'
const WARNING_VEHICLE_NAME = '警告テスト車両'
const DANGER_VEHICLE_NAME = '危険テスト車両'

test.describe('車検アラート', () => {
  const admin = createAdminClient()
  let user: E2eTestUser

  test.beforeAll(async () => {
    user = await createTestUser(admin, 'shaken-alert')
    await seedVehicle(user.client, {
      name: WARNING_VEHICLE_NAME,
      vehicleType: 'car',
      shakenExpiryDate: WARNING_EXPIRY,
    })
    await seedVehicle(user.client, {
      name: DANGER_VEHICLE_NAME,
      vehicleType: 'car',
      shakenExpiryDate: DANGER_EXPIRY,
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(admin, user.id)
  })

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW)
    await loginViaUi(page, user.email, user.password)
    await page.waitForURL((url) => url.pathname === '/')
  })

  test('ダッシュボードで警告(55日前)・危険(20日前)が正しい段階で表示される', async ({ page }) => {
    const warningItem = page.locator('li', { hasText: WARNING_VEHICLE_NAME })
    await expect(warningItem.getByRole('status')).toHaveText(
      /車検まであと55日です。そろそろ予約をご検討ください。/,
    )

    const dangerItem = page.locator('li', { hasText: DANGER_VEHICLE_NAME })
    await expect(dangerItem.getByRole('alert')).toHaveText(/車検まであと20日です。お早めに受検してください。/)
  })

  test('車両詳細ページでも同じ段階が表示される', async ({ page }) => {
    await page.getByRole('link', { name: WARNING_VEHICLE_NAME }).click()
    await expect(page.getByRole('status')).toContainText('車検まであと55日です')

    await page.goBack()
    await expect(page).toHaveURL('/')

    await page.getByRole('link', { name: DANGER_VEHICLE_NAME }).click()
    await expect(page.getByRole('alert').first()).toContainText('車検まであと20日です')
  })
})
