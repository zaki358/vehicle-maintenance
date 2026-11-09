# styles.css

`src/styles.css`

## 概要

アプリ全体のスタイルの**入口**です。実際のルールはここには 1行も書かず、`src/styles/` 以下に分割した7つのファイルを `@import` で並べるだけのファイルになっています。

ルートルート（`src/routes/__root.tsx`）がこのファイル1つだけを読み込むため、スタイルを追加したいときは `styles/` に新しいファイルを作ってここに1行足すだけで済みます。逆に言えば、 **読み込み順という重要な情報がこの1ファイルに集約**されており、それがこのファイルの存在意義です。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `tokens.css` | @import（1番目） | design.md のトークンを CSS 変数として定義 |
| `base.css` | @import（2番目） | リセットと地の文のタイポグラフィ |
| `layout.css` | @import（3番目） | タイル・コンテナ・グリッドなどの骨格 |
| `nav.css` | @import（4番目） | 2段ナビ |
| `buttons.css` | @import（5番目） | ボタンの3文法 |
| `forms.css` | @import（6番目） | 入力フォーム |
| `cards.css` | @import（7番目） | カード・アラート・一覧行 |

## コード解説

```css
/*
 * アプリ全体のスタイルの入口。実体は styles/ 以下に分割してある。
 * 読み込み順に意味がある: トークン → 地の文 → 部品。
 */
```

分割の方針は CLAUDE.md の「小さいファイルを多数」に沿ったものです。以前は 1枚の `styles.css` にすべてが入っていましたが、役割ごとに切り出すことで「ボタンの見た目を直したい」ときに開くべきファイルが自明になります。

```css
@import './styles/tokens.css';
@import './styles/base.css';
@import './styles/layout.css';
```

**順番に意味があります。**まず `tokens.css` が `:root` に変数を定義し、以降のファイルがそれを参照します。（CSS カスタムプロパティ自体は宣言順に依存しませんが、「トークンが土台である」という依存関係を並び順で表現しています。）

次に `base.css` が素の HTML 要素（`body`、 `h1`、`a` など）のスタイルを決め、その上に `layout.css` 以降のクラスが乗ります。 **要素セレクタより後にクラスセレクタを置く**ことで、詳細度が同じ場合でも後勝ちで上書きでき、 `!important` を使わずに済みます。

実際、`buttons.css` の `.btn:hover` は `base.css` の `a:hover` の下線を打ち消していますし、 `forms.css` の入力欄フォーカスは `base.css` の `:focus-visible` を上書きしています。どちらもこの読み込み順が前提です。

```css
@import './styles/nav.css';
@import './styles/buttons.css';
@import './styles/forms.css';
@import './styles/cards.css';
```

後半は部品（コンポーネント）のスタイルです。この中でも `buttons.css` を `nav.css` より後に置いているのは、 `.nav .btn-utility` という**ナビ文脈での上書き**が `buttons.css` 側に書かれているためです。同様に `cards.css` の `.list-row .card-actions` も最後に読み込まれることで確実に効きます。

なお `@import` は Vite のビルド時に解決され、本番では1つの CSS ファイルにまとめられます。ブラウザが `@import` を逐次解決するときの読み込み遅延（ウォーターフォール）は発生しません。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles.css*
