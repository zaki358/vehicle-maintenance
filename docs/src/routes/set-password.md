# set-password.tsx

`src/routes/set-password.tsx`

## 概要

招待メール、またはパスワード再設定メールのリンクを踏んだ利用者が、パスワードを決めるための画面（`/set-password`）です。このアプリには公開サインアップがなく、アカウントは管理者が招待して作るため、利用者が最初にパスワードを持つ唯一の入口がこのページになります。

ページを開いた時点で、URL のハッシュに入っているトークンからログイン状態（セッション）を確立し、それに成功したときだけ入力欄を表示します。パスワードの保存は、サーバー関数を経由せずブラウザから `supabase.auth.updateUser()` を直接呼びます。

**このページを `_authed` 配下に置けない理由** — URL のハッシュ（`#` 以降）はブラウザからサーバーへ送信されません。ログイン必須レイアウト（`_authed.tsx`）に入れると、サーバー側の `beforeLoad` がハッシュを見られないまま「未ログイン」と判定し、 `/login` へリダイレクトしてしまいます。そのため、このページだけはガードの外に置いてあります。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | `/set-password` のルート定義 |
| `MISSING_LINK_MESSAGE` | const | リンク経由で開かれていないときの案内文 |
| `SessionStatus` | type | セッション確立の状態（確認中／準備完了／利用不可） |
| `SetPasswordPage` | component | 画面本体。状態に応じてフォームか案内文を出し分ける |
| `EstablishResult` | type | `establishSession` の結果（成功／失敗＋文言） |
| `establishSession` | function | ハッシュを解析してセッションを確立する |

## コード解説

```tsx
type SessionStatus = 'checking' | 'ready' | 'unavailable'
```

セッションの確立は非同期（ネットワーク通信を伴う）なので、画面には「まだ確認中」という途中状態が必ず存在します。 3状態を明示的に持つことで、確認が終わる前に入力欄を見せてしまい、送信して初めてエラーになる、という分かりにくい挙動を防いでいます。

```tsx
useEffect(() => {
  let cancelled = false
  establishSession().then((result) => {
    if (cancelled) return
    setStatus(result.ok ? 'ready' : 'unavailable')
    setError(result.ok ? null : result.message)
  })
  return () => {
    cancelled = true
  }
}, [])
```

マウント時に一度だけセッションの確立を試みます。 `cancelled` フラグは、処理が終わる前に画面から離れた場合にアンマウント後の状態更新を避けるためのものです。開発時の React StrictMode では副作用が意図的に2回実行されるため、この後始末が特に効いてきます。

```tsx
{status === 'checking' && <p>リンクを確認しています…</p>}
{status === 'ready' && (
  <form onSubmit={handleSubmit}>
    ...
  </form>
)}
{error && <p role="alert">{error}</p>}
```

入力欄はセッションが確立できたとき（`ready`）だけ表示します。リンクが期限切れだった場合などは、入力しても保存できないので、最初から入力欄を出さずに理由を伝えます。

エラー文には `role="alert"` を付けています。スクリーンリーダーが、画面を読み進めている途中でもエラーの出現を読み上げるようになります。

```tsx
if (password.length < 8) {
  setError('パスワードは8文字以上で設定してください')
  return
}
if (password !== confirmPassword) {
  setError('確認用パスワードが一致しません')
  return
}
```

送信前の簡易チェックです。ここでの検証はあくまで利用者への素早いフィードバックが目的で、実際の強度チェックは Supabase 側でも行われます（弱すぎる場合は `weak_password` が返り、 `authErrorMessage()` が日本語の案内に変換します）。

```tsx
const parsed = parseAuthHash(window.location.hash)

if (parsed.kind !== 'none') {
  // トークンを URL に残さない（履歴・画面共有・Referer からの漏洩を防ぐ）
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
```

ハッシュを読み取ったら、すぐに URL から消します。アクセストークンはそのままログイン情報として使えるため、ブラウザ履歴や、画面共有、スクリーンショットに残るのは望ましくありません。 `replaceState` を使うので、履歴に新しいエントリを増やさずに URL だけを差し替えられます。

```tsx
if (parsed.kind === 'tokens') {
  const { error } = await supabase.auth.setSession({
    access_token: parsed.accessToken,
    refresh_token: parsed.refreshToken,
  })
  return error
    ? { ok: false, message: authErrorMessage({ code: error.code, message: error.message }) }
    : { ok: true }
}
```

取り出したトークンを `setSession()` に渡して、明示的にログイン状態を作ります。`@supabase/ssr` のブラウザクライアントは `flowType` が `"pkce"` に固定されていて、メールのリンクが使う implicit 形式のハッシュを自動では取り込まないため、この一手間が必要です（詳細は `parse-auth-hash.ts` の解説を参照）。

セッション用 Cookie をあえて httpOnly に**しない**設計（`integrations/supabase/server.ts` 参照）なので、ここでブラウザ側が書き込んだセッションは、そのままサーバー関数からも読めます。

```tsx
const { data } = await supabase.auth.getSession()
return data.session ? { ok: true } : { ok: false, message: MISSING_LINK_MESSAGE }
```

ハッシュが無い場合（`kind === 'none'`）の扱いです。すでにログイン済みの利用者が自分でこの URL を開いたケースではパスワード変更を許可したいので、既存のセッションを確認してから判断します。セッションも無ければ、リンクから開くよう案内します。

ページの再読み込み時にもここを通ります。1回目の表示でハッシュを消しているため、リロード後はこの経路に入りますが、セッションはすでに確立済みなので入力欄はそのまま表示され続けます。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/routes/set-password.tsx*
