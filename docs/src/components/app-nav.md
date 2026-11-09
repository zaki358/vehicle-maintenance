# app-nav.tsx

`src/components/app-nav.tsx`

## 概要

ログイン後のすべてのページ上部に表示される、黒いグローバルナビの React コンポーネントです。アプリ名（ダッシュボードへのリンク）、「ダッシュボード」「車両」の2リンク、そしてログアウトボタンを持ちます。

`_authed` レイアウトルートから呼ばれるため、認証済みの全画面に自動的に出ます。ログアウトをここに置いているのは、 **どの画面からでも同じ場所で操作できる**ようにするためです（以前はダッシュボードにだけ置いていたため、車両詳細画面などからは一度戻らないとログアウトできませんでした）。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `AppNav` | component（export） | 黒いグローバルナビ本体。props は取らない |
| `loggingOut` | state | ログアウト処理中フラグ。ボタンの二重押し防止 |
| `error` | state | ログアウト失敗時のメッセージ |
| `handleLogout` | function | サーバー関数を呼び、成功したら /login へ遷移 |

## コード解説

```tsx
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { logoutFn } from '@/features/auth/server/logout'
```

画面遷移は `<a href>` ではなく TanStack Router の `<Link>` と `useNavigate` で行います。これによりページ全体の再読み込みが起きず、クライアント側のルーティングだけで切り替わります。

ログアウトの実体 `logoutFn` はサーバー関数です。セッション Cookie は `HttpOnly` なのでブラウザ側の JavaScript からは消せず、サーバーに削除させる必要があります。

```tsx
export function AppNav() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
```

props を一切取りません。表示するリンクが固定で、ログイン中のユーザー情報もここでは使わないため、呼び出し側は `<AppNav />` と書くだけで済みます。状態は処理中フラグとエラーメッセージの2つだけです。

```tsx
  async function handleLogout() {
    setLoggingOut(true)
    setError(null)
    try {
      await logoutFn()
      await navigate({ to: '/login', replace: true })
    } catch {
      setError('ログアウトに失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoggingOut(false)
    }
  }
```

**`replace: true` が重要です。** 通常の遷移だと履歴にダッシュボードが残り、ログアウト後にブラウザの「戻る」を押すと前の画面が bfcache から復元されてしまうことがあります。履歴を置き換えることで、戻る操作でログイン済みの画面に戻れないようにしています。

**エラーを握りつぶさない** — `catch` で日本語のメッセージを state に立てます。ネットワーク断などでログアウトに失敗したのに画面が何も変わらないと、利用者は「ログアウトできた」と誤解したまま離席しかねません。

`finally` でフラグを必ず下ろすので、失敗してもボタンが無効のまま固まりません。成功時は既に別画面へ遷移しているため、フラグの後始末は実質的に失敗経路のためのものです。

```tsx
      <nav className="nav">
        <Link to="/" className="nav-brand">
          車両メンテナンス記録
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">ダッシュボード</Link>
          <Link to="/vehicles" className="nav-link">車両</Link>
          <button type="button" className="btn btn-utility" onClick={handleLogout} disabled={loggingOut}>
            ログアウト
          </button>
        </div>
      </nav>
```

**ハンバーガーメニューを持たない理由** — design.md の元仕様では 834px 以下でナビをハンバーガーに畳みますが、ここにある項目は3つだけです。開閉状態を持つメニューは、開閉のフォーカス管理・Esc キーでの閉じ処理・外側クリックの検知・それらの E2E テストまで必要になります。3項目を隠すために払うコストとしては割に合わないため、`nav.css` 側で文字間と余白を詰めて横一列のまま収める方針にしました。

`<nav>` 要素を使っているので、支援技術はこの領域をナビゲーションのランドマークとして認識し、まとめて読み飛ばしたり直接ジャンプしたりできます。

ログアウトだけが `<button>` なのは、これが遷移ではなく **状態を変える操作**だからです。`type="button"` を明示しているのは、将来このナビがフォーム内に置かれても意図せず送信ボタンとして働かないようにするためです。

```tsx
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
```

エラーは `<nav>` の**外側**、フラグメントの 2番目の子として描画します。黒いナビの中に入れると背景と文字色が衝突しますし、ナビゲーションのランドマークにエラー文が含まれるのも意味的に不自然だからです。

`role="alert"` を付けることで、スクリーンリーダーがメッセージの出現を即座に読み上げます。ログアウトボタンからフォーカスを移さなくても失敗が伝わります。

スタイルは `forms.css` の `.alert`（暗いタイル）を流用しています。design.md が第2のアクセント色を禁じているため、エラーは赤ではなく面の明暗で示す、という方針がここでも一貫しています。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/components/app-nav.tsx*
