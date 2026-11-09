# cards.css

`src/styles/cards.css`

## 概要

白いユーティリティカード（design.md の `store-utility-card`）と、その派生である車検アラート・空状態・中央寄せカード・一覧行のスタイルです。車両カード、整備記録の行、ログイン画面のカードなど、アプリの一覧系・詳細系の見た目はほぼこのファイルで決まります。

**カードに影は付けません。**design.md の Shadow philosophy が「影は製品写真のためだけのもので、カード・ボタン・文字には使わない」と定めているためです。立体感は白 × parchment 背景の明度差と、 1px のヘアラインだけで表現します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `.card` | クラス | 白いカードの基本形 |
| `.card-title` | クラス | カード見出し（21px display） |
| `.card-meta` / `-label` | クラス | 型式・区分などの小さな属性 |
| `.card-actions` | クラス | カード下端に寄せる操作群 |
| `.card-alert` | クラス | 車検アラートの基底 |
| `.card-alert-warning` | 修飾クラス | 軽度。明るい面 |
| `.card-alert-danger` | 修飾クラス | 重度。暗いタイル |
| `.empty-state` | クラス | データが無いときの案内 |
| `.card-centered` | 修飾クラス | ログイン等、1枚だけ中央に置く |
| `.list-row` ほか | クラス | 整備記録の一覧行 |

## コード解説

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  background: var(--canvas);
}
```

白・18px 角丸・1px のヘアライン・24px パディングという、 design.md の `store-utility-card` をそのまま写した形です。影が無くても輪郭が見えるのは、ページ背景が純白ではなく parchment（#f5f5f7）だからです（`base.css` の `body`）。

縦フレックスにしているのは、次に出てくる `.card-actions { margin-top: auto }` を成立させるためです。

```css
.card-title {
  font-family: var(--font-display);
  font-size: var(--text-tagline-size);
  font-weight: 600;
  line-height: var(--leading-tagline);
}

.card-title a { color: var(--ink); }
```

カード見出しは `<h3>` 相当の 21px です。見出し全体がリンクになる場合（車両名をタップして詳細へ）でも、文字色は `--ink` のままにします。カード全体が押せることは文脈から明らかで、見出しまで青くすると一覧が青だらけになって「どこが主要な操作か」が読み取れなくなるためです。

```css
/* 「型式・区分」など、見出しの下に並べる小さな属性 */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
  font-size: var(--text-caption-size);
  ...
  color: var(--ink-muted-80);
}

.card-meta-label { color: var(--ink-muted-48); }
```

`gap` に2値（縦 8px / 横 17px）を指定しているのがポイントです。折り返したときの行間は詰め、横方向は広めに取ることで、「型式: ABC-123」「区分: 軽自動車」といった項目の切れ目が区切り文字なしでも読み取れます。

ラベル部分だけ一段薄い色にして、値との主従を作ります。ここでも太字や色ではなく、明度差だけで階層を表しています。

```css
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: auto;
  padding-top: var(--space-sm);
}
```

`margin-top: auto` により、カード内の余った縦方向の空きをすべて上側に押し付け、操作ボタンを**カードの下端**に固定します。グリッドに並ぶカードは高さが揃うため（`.card-grid` の既定の `stretch`）、備考の長さが違っても全カードのボタンが同じ高さに並びます。

```css
/* 車検アラート。色を足さず、段階を面の明暗で表す */
.card-alert {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-caption-size);
  ...
}

.card-alert-warning {
  border: 1px solid var(--hairline);
  background: var(--canvas-parchment);
  color: var(--ink-muted-80);
}

.card-alert-danger {
  background: var(--surface-tile-1);
  color: var(--body-on-dark);
}

.card-alert-danger a { color: var(--color-primary-on-dark); }
```

**危険（期限切れ間近・超過）が赤くない理由** — design.md は「第2のアクセント色を導入してはならない」と明確に禁じています。赤を足すと、このシステムで唯一「押せる」を意味していた青の役割が薄まり、色の意味づけ全体が崩れます。

そこで深刻度は**面の明暗**で表します。警告（`-warning`）は白いカードの中の少し暗い灰色の箱、危険（`-danger`）は白いカードの中の暗いタイルです。白地に黒い箱が現れるコントラストは赤に劣らず目を引き、色覚特性にも依存しません。

暗いタイルの上のリンク（「車検を記録する」など）は `--color-primary-on-dark` に差し替えて可読性を確保します。

```css
/* 何も無いときの案内 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xxl) var(--space-lg);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  background: var(--canvas);
  text-align: center;
  color: var(--ink-muted-80);
}
```

車両も記録も無い初回利用時に出す箱です。カードと同じ白・同じ角丸を使いつつ、中身を中央寄せにして上下に厚い余白（48px）を取ります。「壊れているのではなく、まだ何も登録していないだけ」だと一目で伝わり、中央に置いた主ボタンへ視線が向かいます。

```css
/* ログイン等、1枚だけ中央に置くカード */
.card-centered {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: var(--space-xl);
  gap: var(--space-lg);
}
```

ログイン画面とパスワード設定画面で使う修飾クラスです。 `.card` と併用する前提で、幅・中央寄せ・余白だけを上書きします。 420px は入力欄1列がちょうど収まる幅で、パディングと内部 gap も1段広げて、単独で置かれたときの間の持たなさを補います。

```css
/* 記録の一覧行 */
.list-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs) var(--space-md);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--hairline);
}

.list-row:last-child { border-bottom: none; }
```

整備記録の一覧は、1件ずつカードにすると縦に長くなりすぎるため、区切り線で仕切った行にしています。`align-items: baseline` にすることで、サイズの違う文字（日付・作業名・走行距離）の **文字の下端**が揃い、きれいな1行に見えます。

最後の行だけ下線を消すのは、カードの内枠と二重線になるのを避けるためです。

```css
.list-row-primary { font-weight: 600; }

.list-row-meta {
  font-size: var(--text-caption-size);
  letter-spacing: var(--tracking-caption);
  color: var(--ink-muted-80);
}

/* 行の操作ボタンは右端に寄せる（縦積みのカードでは .card-actions が上詰めになる） */
.list-row .card-actions {
  margin-left: auto;
  padding-top: 0;
}
```

`.card-actions` は縦積みのカード用に `margin-top: auto` を持っていますが、 `.list-row` は**横並び**のフレックスなので、そのままでは意図した位置に来ません。そこで行の中でだけ `margin-left: auto` に読み替え、ボタンを右端へ寄せます。上パディングも 0 に戻し、行の高さが不必要に増えないようにしています。

クラス名を増やさず、**文脈による上書き**で挙動を切り替えているのは `buttons.css` の `.nav .btn-utility` と同じ考え方です。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles/cards.css*
