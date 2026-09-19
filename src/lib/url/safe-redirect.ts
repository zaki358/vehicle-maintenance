/**
 * ログイン後リダイレクト先として安全かどうかを判定する。
 *
 * `/login?redirect=...` はアプリ内部（`requireUser` が `location.href` を渡す）
 * だけでなく、URL を直接いじる第三者からも値を差し込める。`redirect` を
 * 素通しで `navigate({ href })` に渡すと、絶対URL（`https://evil.example.com`）や
 * プロトコル相対URL（`//evil.example.com`）を渡すことでログイン成功直後に
 * 外部サイトへ強制遷移させられる（オープンリダイレクト）。
 *
 * そのため「単一の `/` で始まり、`//` にも `/\` にもならない」相対パスだけを
 * 安全とみなす。`/\` を弾くのは、一部のブラウザがバックスラッシュを
 * スラッシュと同一視し、結果的に `//evil.example.com` と同じ扱いになりうるため。
 */
export function isSafeRedirectPath(value: string): boolean {
  if (!value.startsWith('/')) {
    return false
  }
  if (value.startsWith('//') || value.startsWith('/\\')) {
    return false
  }
  return true
}
