# safe-redirect.ts

`src/lib/url/safe-redirect.ts`

## 概要

Phase 8のセキュリティレビューで見つかった**オープンリダイレクト**の脆弱性を塞ぐための、たった1つの純粋関数だけを持つファイルです。

ログイン画面（`/login`）は `?redirect=/vehicles` のようなクエリパラメータを受け取り、ログイン成功後にそこへ遷移します。この値は `_authed.tsx`（未ログイン時のガード）が自動的に付ける場合は常に安全なアプリ内パスですが、 **URLを直接いじれる第三者は、ここに任意の絶対URL （例: `https://evil.example.com`）を差し込めます。** 検証なしにこの値をそのままブラウザの遷移先へ渡すと、「正規サイトでログインした直後に外部サイトへ強制的に飛ばされる」というフィッシングに悪用できる状態になります。 `isSafeRedirectPath` は、この値が「アプリ内の相対パスだけ」であることを保証するための判定関数です。

`src/**/lib/**` の他のファイルと同じく、 React・TanStack・Supabase を一切importしない純粋関数です（プロジェクトのESLint境界ルールにより強制されています）。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `isSafeRedirectPath` | function（export） | 値が安全なアプリ内相対パスかどうかを判定する |

## コード解説

```ts
export function isSafeRedirectPath(value: string): boolean {
  if (!value.startsWith('/')) {
    return false
  }
  if (value.startsWith('//') || value.startsWith('/\\')) {
    return false
  }
  return true
}
```

3つのチェックだけで構成されています。

- **`'/'` で始まらない値を拒否する。** `https://evil.example.com` のような絶対URLはこれだけで弾かれます。 `javascript:alert(1)` のような危険なスキームも同様です（TanStack Router 自身も別途 `javascript:` 等を拒否しますが、そもそも `/` で始まらないのでここで先に弾かれます）。
- **`'//'` で始まる値を拒否する。** `//evil.example.com` は「プロトコル相対URL」と呼ばれる形式で、ブラウザは現在のプロトコル（`https:`）を補って `https://evil.example.com` として解釈します。先頭が `/` 1文字だけでは見抜けないため、専用のチェックが必要です。
- **`'/\'`（スラッシュに続くバックスラッシュ）で始まる値も拒否する。** 一部のブラウザはURL解釈の際にバックスラッシュをスラッシュと同一視するため、 `/\evil.example.com` が結果的に `//evil.example.com` と同じ扱いになりうります。見た目上は `/` で始まる「相対パスらしきもの」なので、このチェックが無いと素通りしてしまいます。

使う側（`src/routes/login.tsx` の `loginSearchSchema`）は、この関数が `false` を返した値を例外にはせず、黙って安全な既定値（`'/'`）にフォールバックさせています。「不正な値が来たらエラー画面ではなく、普通にトップへ送る」という UX上の判断です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/lib/url/safe-redirect.ts*
