# layout.css

`src/styles/layout.css`

## 概要

ページの骨格を作るユーティリティクラス群です。全幅のタイル（`.section`）、中央寄せの内容幅（`.container`）、縦積み（`.stack`）、カードのグリッド（`.card-grid`）といった、どの画面でも使い回す入れ物だけを定義しています。

design.md の Layout では、セクションの区切りは**境界線ではなく背景色の切り替わりそのもの**で表す、とされています。そのため `.section` 系は色違いのバリエーションを持ち、 `border` を一切持ちません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `.page` | クラス | ページ全体の縦フレックス。最低画面高を確保 |
| `.section` | クラス | 全幅タイル。既定は parchment 背景 |
| `.section-light` / `.section-dark` | 修飾クラス | 白タイル／暗タイル |
| `.section-compact` | 修飾クラス | 実務画面向けに上下余白を詰める |
| `.container` | クラス | 最大 1440px で中央寄せ |
| `.container-narrow` / `.container-reading` | 修飾クラス | フォーム用 680px／読み物用 980px |
| `.stack` / `-tight` / `-loose` | クラス | 縦積みと余白の3段階 |
| `.section-head` ほか | クラス | 見出し＋リード文＋補足の組 |
| `.card-grid` | クラス | 3→2→1 列に畳むカードグリッド |

## コード解説

```css
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

ページ全体を縦フレックスにし、最低でも画面の高さを確保します。内容が少ない画面（空の車両一覧など）でも背景が画面下まで伸び、ブラウザの地色が覗かないようにするためです。

```css
.section {
  padding: var(--space-section) var(--space-lg);
  background: var(--canvas-parchment);
}

.section-light { background: var(--canvas); }

.section-dark {
  background: var(--surface-tile-1);
  color: var(--body-on-dark);
}

.section-dark a { color: var(--color-primary-on-dark); }
```

`.section` は上下に `--space-section`（デスクトップ 80px、 735px 以下では 48px）、左右に 24px の余白を持つ全幅タイルです。タイルを縦に並べたとき、背景色の切り替わりが区切り線の役目を果たすので、 `border-top` の類は書きません。

`.section-dark` は背景だけでなく文字色も同時に反転させ、さらに**子孫のリンク色まで**明るい青に差し替えます。これを忘れると暗背景の上に `#0066cc` のリンクが乗って読めなくなるため、タイル側でまとめて面倒を見るのが安全です。

```css
/* 通常のセクションより詰めたい実務画面向け */
.section-compact {
  padding: var(--space-xxl) var(--space-lg);
}
```

design.md が想定する 80px 余白は製品紹介ページ向けの密度で、一覧や入力フォームのような**作業画面**ではスクロールが増えすぎます。そこで 48px に詰めた変種を用意しました。新しい数値を発明せず `--space-xxl` を流用しているので、余白の階段からは外れません。

```css
.container {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
}

.container-narrow { max-width: 680px; }
.container-reading { max-width: var(--content-max-reading); }
```

タイルは全幅でも、中身は読みやすい幅に制限します。 `.container-narrow`（680px）はフォーム用です。入力欄を画面いっぱいに広げると、ラベルと入力内容の視線移動が長くなり、 1行の文字数も増えて読みづらくなります。

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.stack-tight { gap: var(--space-sm); }
.stack-loose { gap: var(--space-xl); }
```

縦方向の余白はすべて `gap` で与えます。margin を使わないことでマージンの相殺が起こらず、「最後の要素だけ余白が残る」といった後始末（`:last-child` の打ち消し）も不要になります。 `base.css` で見出しや段落の margin を 0 にしてあるのは、この方針を成立させるためです。

```css
.section-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.section-head-lead {
  font-size: var(--text-lead-size);
  line-height: 1.14;
  letter-spacing: 0.196px;
  color: var(--ink-muted-80);
}

.section-dark .section-head-lead { color: var(--body-muted); }
```

見出しとリード文の組です。リード文の字間が**正の値** （0.196px）なのは design.md の lead タイポグラフィに由来します。本文（17px）は詰め、大きなリード文（28px）はわずかに開く、というサイズごとの調整が元の仕様に含まれています。

暗いタイルの中では文字色を `--body-muted` に差し替えます。 `--ink-muted-80`（#333333）は暗背景上ではほぼ見えないためです。

```css
/* 見出しに添える補足（ログイン中のメールなど）。長い文字列でも折り返して収める */
.section-head-note {
  font-size: var(--text-caption-size);
  ...
  color: var(--ink-muted-48);
  overflow-wrap: anywhere;
}
```

`overflow-wrap: anywhere` が要点です。ここにはログイン中のメールアドレスのような**空白を含まない長い文字列**が入ります。通常の折り返しは単語の途中で切れないため、狭い画面では横スクロールが発生してしまいます。`anywhere` を指定すると文字の途中でも改行できるようになり、レイアウトが壊れません。

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1068px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .card-grid { grid-template-columns: 1fr; gap: var(--space-md); } }
```

車両カードの並びです。design.md の Collapsing Strategy に沿って 3列 → 2列 → 1列と畳みます。区切りの 1068px は design.md が定めるブレークポイント（Apple のレイアウト幅に由来）をそのまま使っています。

1列になる段階では `gap` も 24px から 17px に詰めます。横並びが無くなると縦の余白だけが残るため、同じ 24px では間延びして見えるからです。

```css
@media (max-width: 480px) {
  .section {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }
}
```

小さな画面では左右の余白を 24px から 17px に詰め、内容に使える幅を 14px 広げます。`nav.css` も同じ 480px の境界で同じ値に詰めており、ナビの左端とコンテンツの左端が揃い続けます。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles/layout.css*
