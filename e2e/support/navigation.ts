import type { Page } from '@playwright/test'

/**
 * `page.goto()` の直後にフォーム入力・クリックを行うと、TanStack Start の
 * 開発サーバーでは(未バンドルのESMを1ファイルずつ読み込むため)ハイドレーションが
 * 完了する前にクリックが届いてしまうことがある。その場合 React の
 * `onSubmit` ハンドラがまだアタッチされておらず、ブラウザの素の
 * フォーム送信（`name`属性の無い入力欄なのでクエリなしの GET 再読み込み）が
 * 発生し、ログイン処理が一切実行されないまま同じ画面に戻ってしまう
 * （実際にこの競合を再現して確認した上で対策した）。
 *
 * `waitUntil: 'networkidle'` を挟むことで、ハイドレーションに必要な
 * モジュール読み込みが落ち着いてからテスト操作を始められる。
 */
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' })
}
