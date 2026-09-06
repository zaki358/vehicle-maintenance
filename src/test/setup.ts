import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library の自動クリーンアップは globals: true のときしか働かない。
// このプロジェクトは globals を有効にしていない（import を明示する方針）ため、
// 各テストの後に手動で DOM を片付ける。
// これを忘れると、前のテストが描画した要素が次のテストで見つかってしまう。
afterEach(() => {
  cleanup()
})
