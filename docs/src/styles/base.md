# base.css

`src/styles/base.css`

## 概要

ブラウザ既定のスタイルをならす「リセット」と、アプリ全体の地の文（body・見出し・段落・リスト・リンク）のタイポグラフィを定義するファイルです。 class を付けなくても素の HTML 要素が正しい見た目になる、という層を担当します。

ここで使う値はすべて `tokens.css` の変数です。本文は **17px / 行送り 1.47 / 字間 -0.374px**（design.md の Principles。よくある 16px にはしない）で、見出しだけ display 書体に切り替えます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `*, *::before, *::after` | リセット | `box-sizing: border-box` に統一 |
| `html` | リセット | 横向き時の文字サイズ自動拡大を止める |
| `body` | 基本スタイル | 背景・文字色・本文タイポグラフィ |
| `h1, h2, h3` | 基本スタイル | display 書体・太さ 600・余白リセット |
| `p, ul` | リセット | 既定マージンと行頭記号を除去 |
| `a / a:hover` | 基本スタイル | アクセント青・下線はホバー時のみ |
| `:focus-visible` | アクセシビリティ | 全要素共通のフォーカスリング |
| `@media (max-width: 640px / 419px)` | メディアクエリ | 見出しを段階的に縮小 |

## コード解説

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}
```

`border-box` に統一すると、`width: 100%` の入力欄に `padding` と `border` を足しても親からはみ出しません。 `forms.css` の `.field-input` がまさにこの形なので、この1行が無いとフォームが横スクロールを起こします。

`-webkit-text-size-adjust: 100%` は、iOS Safari が端末を横向きにしたときに文字だけ勝手に拡大する挙動を止めるものです。 17px という本文サイズを意図して決めているので、ブラウザ側に書き換えられては困ります。

```css
body {
  margin: 0;
  background: var(--canvas-parchment);
  color: var(--ink);
  font-family: var(--font-text);
  font-size: var(--text-body-size);
  font-weight: 400;
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
  -webkit-font-smoothing: antialiased;
}
```

背景は純白ではなく `--canvas-parchment`（#f5f5f7）です。白いカード（`cards.css` の `.card`）を、影ではなく **背景との明度差**で浮かせるためで、ページ全体が白だとカードの輪郭が消えてしまいます。

サイズ・行送り・字間を body にまとめて指定することで、以降のファイルでは「本文と違うときだけ」書けばよくなります。 `-webkit-font-smoothing: antialiased` は macOS の WebKit で文字を細く見せる指定で、SF Pro 本来の線の太さに近づけます。

```css
h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: 600;
  margin: 0;
}

h1 { font-size: var(--text-display-lg-size); line-height: var(--leading-display-lg); ... }
h2 { font-size: var(--text-display-md-size); line-height: var(--leading-tagline); ... }
h3 { font-size: var(--text-tagline-size); line-height: var(--leading-tagline); }
```

見出しは display 書体、太さは **600（semibold）**で固定です。 design.md には 700 以上の太字が登場しないため、bold を使いたくなってもここで止めています。

`margin: 0` で既定の上下マージンを消しているのは、余白をすべて親側の `gap`（`.stack` や `.section-head`）で管理するためです。マージンの相殺（margin collapsing）に悩まされず、余白の出所が1か所に定まります。

```css
p {
  margin: 0;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
```

段落・リストも同様に既定マージンを落とし、行頭の黒丸も消します。このアプリのリスト（車両一覧・整備記録一覧）は記号付きの箇条書きではなくカードや行として見せるため、`<ul>` は「意味としてのリスト」だけを担い、見た目は別途与えます。

```css
a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

リンクは唯一のアクセント青、下線は既定では出さずホバー時のみ出します。 design.md の Apple 的な見え方では、平常時のリンクは色だけで「押せる」ことを示し、下線はノイズとして扱われます。

なお色だけに頼るとカラーバリアの利用者に伝わりにくいため、ホバー／フォーカス時には下線とフォーカスリングという色以外の手掛かりが出るようにしています。

```css
/* フォーカスリングは design.md の focus token に統一 */
:focus-visible {
  outline: 2px solid var(--color-primary-focus);
  outline-offset: 2px;
}
```

`:focus` ではなく `:focus-visible` を使うのが重要です。 `:focus` だとマウスでボタンを押しただけでリングが残り、見た目が煩雑になります。`:focus-visible` はキーボード操作など「リングが必要な場面」でのみ適用されるため、 **キーボード利用者の可視性を保ちつつ**マウス利用者の画面は静かなままにできます。

ここで全要素にまとめて定義しているので、個々のボタンやリンクでフォーカス指定を書く必要がありません。唯一の例外は入力欄で、 `forms.css` が `outline-offset: 0` に上書きしています（枠線と二重に見えるのを避けるため）。

```css
/* 見出しは画面幅に応じて段階的に縮める（design.md の Hero typography） */
@media (max-width: 640px) {
  h1 { font-size: var(--text-display-md-size); }
  h2 { font-size: var(--text-lead-size); }
}

@media (max-width: 419px) {
  h1 { font-size: var(--text-lead-size); }
}
```

40px の `h1` をスマートフォンでそのまま出すと、「整備記録の登録」程度の見出しでも複数行に折り返して画面を占有します。そこで 640px 以下で 34px、419px 以下で 28px と**2段階**に縮めます。

縮め先の値も新しい数値ではなく、既存のタイプスケール（`--text-display-md-size` / `--text-lead-size`）を流用しています。これにより、どの画面幅でも見出しサイズは design.md が定めた階段の上に乗り続けます。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles/base.css*
