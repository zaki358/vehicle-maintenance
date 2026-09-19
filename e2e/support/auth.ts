import type { Page } from '@playwright/test'

import { gotoReady } from './navigation'

/**
 * 実際のログインフォームを操作してログインする。
 *
 * ログイン自体を検証するテスト（`login.spec.ts`）だけでなく、他のテストで
 * 「ログイン済み状態から始める」ためにも使う。storageState の使い回しによる
 * 高速化はあえて採用していない — beforeAll/beforeEach の非同期処理と
 * `test.use()` の同期評価タイミングが噛み合わず、ファイルごとに複雑な
 * カスタムfixtureが必要になるため、シナリオ数が多いこのスイートでは
 * 素直な「毎テストUIログイン」の方が構成がシンプルで壊れにくいと判断した。
 */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await gotoReady(page, '/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
}
