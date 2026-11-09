# nav.css

`src/styles/nav.css`

## 概要

画面上部に貼り付く**2段のナビゲーション**のスタイルです（design.md の Top Navigation）。1段目は高さ 44px の真っ黒なグローバルナビ（`AppNav` コンポーネント）、2段目はすりガラス調のサブナビ（`PageHeader` コンポーネント）で、ページ名とそのページの主要アクションを載せます。

design.md の元仕様では 834px 以下でハンバーガーメニューに畳むことになっていますが、このアプリのナビは**リンクが3つだけ** （ダッシュボード・車両・ログアウト）です。開閉状態というバグの温床を増やしてまで隠す量ではないため、畳まずに文字間と左右余白を詰めて収める方針にしています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `.nav` | クラス | 最上段の黒いバー。sticky で最前面 |
| `.nav-brand` | クラス | 左端のアプリ名リンク。幅が足りないときに縮む唯一の要素 |
| `.nav-links` | クラス | 右寄せのリンク群。縮まない（`flex-shrink: 0`） |
| `.nav-link` | クラス | ナビ内リンク（12px の控えめな文字） |
| `.sub-nav` | クラス | 2段目のすりガラスバー |
| `.sub-nav-title` | クラス | 左のページ名 |
| `.sub-nav-actions` | クラス | 右寄せの主要アクション |
| `.sub-nav-back` | クラス | 戻る導線の小さなリンク |
| `@media (max-width: 480px)` | メディアクエリ | 余白・字間・アプリ名／ページ名サイズを詰める |

## コード解説

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  min-height: var(--nav-height);
  padding: 0 var(--space-lg);
  background: var(--surface-black);
  color: var(--body-on-dark);
}
```

`position: sticky; top: 0` でスクロールしても常に上端に残ります。背景は `--surface-black`（純黒）で、暗いコンテンツタイルの `--surface-tile-1`（#272729）とは別の色です。純黒はナビ専用と決めることで、ナビとページ内容が重なっても境界が分かります。

高さは `height` ではなく `min-height` です。文字サイズを利用者が大きくした場合でも中身が切れず、バーの方が伸びます。値は `--nav-height` で、サブナビの `top` と同じ変数を共有しています。

`z-index: 20` はサブナビ（10）より大きく、2段が重なったときに黒いバーが必ず上に来ます。

```css
.nav-brand {
  /* 幅が足りないときに縮む/省略されるのはここだけ。右のリンクとボタンは固定 */
  min-width: 0;
  overflow: hidden;
  color: var(--body-on-dark);
  font-size: var(--text-caption-size);
  font-weight: 600;
  letter-spacing: var(--tracking-caption);
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

アプリ名は `<Link>` なので `base.css` の `a` ルールで青になってしまいます。黒背景では読みづらいため白に上書きしています。`white-space: nowrap` は「車両メンテナンス記録」が狭い画面で2行に折り返し、バーの高さが崩れるのを防ぐためです。

**`min-width: 0` / `overflow: hidden` / `text-overflow: ellipsis` の3点セットが、ナビ全体の「誰が犠牲になるか」を決めています。**フレックスアイテムの `min-width` は既定で `auto`（＝中身より狭くならない）なので、これを 0 にして初めてアプリ名が縮めるようになります。縮んだ結果入りきらない分は `…` で省略されます。

なぜアプリ名を犠牲にするのか: ナビの中で**読めなくても困らないのはアプリ名だけ**だからです。ロゴ代わりの自己紹介なので途中で切れても意味が通りますが、「ダッシュボード」「車両」「ログアウト」は操作なので、切れたり折り返したりすると押し間違いや高さ崩れに直結します。実測では 320px 幅の端末でのみ省略が発生し、375px 以上では全文が出ます。

```css
.nav-links {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-lg);
  margin-left: auto;
}

.nav-link {
  color: var(--body-on-dark);
  font-size: var(--text-fine-size);
  letter-spacing: var(--tracking-fine);
  white-space: nowrap;
}
```

`margin-left: auto` でリンク群を右端へ押しやります。フレックスの余白を使う方法なので、ブランド名の文字数が変わっても自動で追従します。

`flex-shrink: 0` は**リンク群を絶対に縮めない** という宣言です。既定の `flex-shrink: 1` のままだと、幅が足りないときにリンク群も一緒に潰され、中のログアウトボタンのラベルが「ログア／ウト」と2行に折り返して黒バーの高さが 44px から伸びてしまいます。ここを固定することで、足りない幅のしわ寄せは必ず `.nav-brand` 側（省略表示）へ行きます。

リンクの文字は 12px（`--text-fine-size`）と、本文よりかなり小さくしています。design.md の global-nav 仕様が「静かなリンク」（12px / 400）を求めているためで、ナビがコンテンツより主張しないようにする意図です。

```css
/* サブナビ: 左にページ名、右にそのページの主要アクション */
.sub-nav {
  position: sticky;
  top: var(--nav-height);
  z-index: 10;
  ...
  min-height: var(--sub-nav-height);
  border-bottom: 1px solid var(--hairline-soft);
  background: rgba(245, 245, 247, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}
```

`top: var(--nav-height)` により、黒いバーの**真下**に貼り付きます。数値をベタ書きせず変数を共有しているので、ナビの高さを変更しても2段が重なったり隙間が空いたりしません。

**すりガラス**の実装は、半透明の背景色（`rgba(245, 245, 247, 0.8)`）と `backdrop-filter` の組み合わせです。背後のコンテンツがぼけて透けることで、影を使わずに「このバーは手前に浮いている」という奥行きを表現できます（design.md が影の代わりに許している数少ない手段のひとつ）。 `-webkit-` 付きも併記しているのは Safari 向けです。

なお `backdrop-filter` に未対応のブラウザでも、半透明の背景色だけは効くので、内容が読めなくなることはありません。

```css
.sub-nav-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-tagline-size);
  font-weight: 600;
  line-height: var(--leading-tagline);
  letter-spacing: 0.231px;
}

.sub-nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
}
```

ページ名は 21px の display 書体です。これは `PageHeader` が描画する `<h1>` で、`base.css` の `h1`（40px）をここで上書きしています。 **見た目は小さいがページの主見出し**という扱いのため、マークアップ上は `h1` のまま残しています。

`margin: 0` を明示しているのは、`base.css` の `h1` が既に margin 0 であっても、このクラスだけを見て「バーの高さに余計な余白が入らない」と保証できるようにするためです。

アクション側も `margin-left: auto` で右端へ寄せます。ここに入るのは `.btn-primary` や `.btn-utility` で、ページ名の長短にかかわらず操作の位置が一定に保たれます。

```css
/* 戻る導線はサブナビの上に小さく置く */
.sub-nav-back {
  font-size: var(--text-caption-size);
  letter-spacing: var(--tracking-caption);
}
```

車両詳細から一覧へ戻るような導線用です。サブナビの主要アクションと競合しないよう、14px のキャプションサイズに抑えています。色は `base.css` のリンク色（アクセント青）をそのまま継承します。

```css
@media (max-width: 480px) {
  .nav,
  .sub-nav {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .nav { gap: var(--space-sm); }

  .nav-brand {
    font-size: var(--text-fine-size);
    letter-spacing: var(--tracking-fine);
  }

  .nav-links { gap: var(--space-sm); }

  .sub-nav-title { font-size: var(--text-body-size); }
}
```

ここが**ハンバーガーの代わり**です。左右余白を 24px → 17px、アプリ名とリンク群の間隔およびリンク間隔を 24px → 12px に詰め、アプリ名を 14px → 12px、ページ名を 21px → 17px に縮めることで、 3つのリンクを横一列のまま収めます。開閉状態を持つメニューを作らずに済むため、フォーカス管理・外側クリックでの閉じ処理・キーボード操作といった実装とテストの負担がまるごと不要になります。

アプリ名を 12px に落とすのは、**リンクと同じ文字サイズに揃える** という意味もあります。狭い画面では 14px のアプリ名だけが浮いて見えるうえ、実測で約 16px 分の横幅を消費していました。12px にすると 375px 幅で省略なしに全文が収まります（実測: アプリ名 101.8px ／ リンク群 172.7px ／余白 34px で、375px に対して約 66px の余裕）。

左右余白の 17px は `layout.css` の `.section` が同じ 480px の境界で使う値と一致しており、ナビの左端とページ内容の左端が縦に揃います。

---

*生成日: 2026-09-20（スマホ幅のナビ調整を反映） ／ 対象ファイル: src/styles/nav.css*
