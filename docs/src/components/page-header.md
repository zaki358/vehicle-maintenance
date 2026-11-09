# page-header.tsx

`src/components/page-header.tsx`

## 概要

黒いグローバルナビ（`AppNav`）の直下に貼り付く、すりガラス調のサブナビを描画する小さなコンポーネントです（design.md の `sub-nav-frosted`）。左にページ名、右にそのページの主要アクションを置きます。

各ページが自前で見出しバーを組み立てると、余白やフォントが少しずつずれていきます。`title` と `actions` の2つだけを受け取る共通部品にすることで、全画面で同じ形が保たれます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `PageHeaderProps` | interface | props の型（非 export） |
| `title` | prop（必須） | ページ名。`<h1>` として描画される |
| `actions` | prop（任意） | 右端に置くボタン等の ReactNode |
| `PageHeader` | component（export） | サブナビ本体 |

## コード解説

```tsx
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}
```

`import type` を使うと、この import はビルド時に完全に消えます（型だけを参照しており、実行時には不要なため）。

`actions` の型を `ReactNode` にしているのが要点です。ボタンの配列でも、単一のリンクでも、`<>...</>` でまとめた複数要素でも受け取れます。このコンポーネントは「何を置くか」には関知せず、**置き場所と余白だけ**を提供します。`?` により省略も可能で、アクションが無いページ（ログイン後のダッシュボードなど）でもそのまま使えます。

```tsx
/**
 * ナビの下に貼り付く、すりガラスのサブナビ（design.md の sub-nav-frosted）。
 * 左にページ名、右にそのページの主要アクションを置く。
 *
 * ページ名は見た目こそ小さいが、そのページの主見出しなので `<h1>` にしている
 * （支援技術やテストがページを特定する手がかりになる）。本文側の見出しは `<h2>` から始める。
 */
```

**見た目と意味を切り離す**という判断が書かれています。サブナビのページ名は 21px と小さく、`base.css` が `h1` に与える 40px とはまったく違う見た目です。それでもマークアップは `<h1>` にしています。

理由は2つあります。ひとつは支援技術で、スクリーンリーダーの利用者は見出しの一覧から「今どのページにいるか」を把握します。もうひとつは E2E テストで、Playwright の `getByRole('heading', { level: 1 })` がページ特定の安定した手がかりになります。

この前提があるため、各ページの本文側の見出しは **`<h2>` から始める**という規約が付随します。本文でも `h1` を使うと1ページに主見出しが2つ生まれ、見出し階層が壊れます。

```tsx
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="sub-nav">
      <h1 className="sub-nav-title">{title}</h1>
      {actions && <div className="sub-nav-actions">{actions}</div>}
    </div>
  )
}
```

状態を持たない純粋な表示コンポーネントです。すりガラスの表現（半透明背景 + `backdrop-filter`）、上部への固定（`position: sticky; top: var(--nav-height)`）、右寄せなどは、すべて `nav.css` の `.sub-nav` 系クラスが受け持ちます。JSX 側は構造だけを担当します。

`{actions && ...}` により、アクションが無いときは `.sub-nav-actions` の `<div>` 自体を出しません。空の要素を残すと `gap` の分だけ余白が生まれ、ページによってバーの見た目がわずかにずれてしまうためです。

外側が `<nav>` ではなく `<div>` なのは、ナビゲーションのランドマークは `AppNav` の `<nav>` が既に担っているからです。ランドマークを重複させると、支援技術での読み飛ばし操作がかえって煩雑になります。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/components/page-header.tsx*
