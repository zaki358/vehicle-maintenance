import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

/**
 * ナビの下に貼り付く、すりガラスのサブナビ（design.md の sub-nav-frosted）。
 * 左にページ名、右にそのページの主要アクションを置く。
 *
 * ページ名は見た目こそ小さいが、そのページの主見出しなので `<h1>` にしている
 * （支援技術やテストがページを特定する手がかりになる）。本文側の見出しは `<h2>` から始める。
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="sub-nav">
      <h1 className="sub-nav-title">{title}</h1>
      {actions && <div className="sub-nav-actions">{actions}</div>}
    </div>
  )
}
