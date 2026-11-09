# tokens.css

`src/styles/tokens.css`

## 概要

デザイン仕様書 `docs/design.md` に書かれている色・タイポグラフィ・余白・角丸・レイアウト寸法を、そのまま CSS カスタムプロパティ（変数）に写し取ったファイルです。デザインシステムの**単一の出所**として、他のスタイルファイルはここで定義した `var(--...)` だけを参照し、生の hex カラーやマジックナンバーの px を書きません。

こうしておくと「この青は design.md のどの色か」を追跡でき、仕様が変わったときもこのファイル1枚を直せば全画面に反映されます。逆に、ここに無い色を使いたくなったらそれは design.md からの逸脱であり、まず仕様側を更新すべき、という判断基準にもなります。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `:root` | セレクタ | 全トークンを定義する唯一のブロック |
| `--color-*` | 変数群 | 唯一のアクセント色（青）とその派生 |
| `--canvas / --surface-*` | 変数群 | 面の色。明るいタイルと暗いタイル |
| `--ink / --body-*` | 変数群 | 文字色。明背景用・暗背景用 |
| `--divider-* / --hairline-*` | 変数群 | 極細の境界線 |
| `--font-* / --text-* / --leading-* / --tracking-*` | 変数群 | 書体とタイプスケール |
| `--space-*` | 変数群 | 8px 基準の余白スケール |
| `--radius-*` | 変数群 | 角丸 |
| `--shadow-product` | 変数 | システム内で唯一許された影 |
| `--nav-height / --content-max / --touch-target` | 変数群 | レイアウト寸法 |
| `@media (max-width: 735px)` | メディアクエリ | 狭い画面でセクション余白を縮める |

## コード解説

```css
:root {
  /* Brand & accent — 対話要素はこの1色だけ */
  --color-primary: #0066cc;
  --color-primary-focus: #0071e3;
  --color-primary-on-dark: #2997ff;
  --color-on-primary: #ffffff;
```

**アクセント色は1つだけ** — design.md は「リンク・ピル型 CTA・フォーカスリングなど、すべての対話要素はこの青ひとつが担う。第2のブランドカラーは存在しない」と定めています。そのため赤や緑といった「警告色」はここに存在しません。危険や注意は色ではなく**面の明暗**（暗いタイル）で表現します（`cards.css` の `.card-alert-danger` を参照）。

3つの青は用途が違います。`--color-primary` は通常の対話要素、 `--color-primary-focus` はフォーカスリング（わずかに明るく、リングとして視認しやすい）、`--color-primary-on-dark` は暗いタイルの上に置くリンク用です。暗背景で `#0066cc` を使うとコントラストが足りないため、明るい青に差し替える必要があります。

```css
  /* Surface */
  --canvas: #ffffff;
  --canvas-parchment: #f5f5f7;
  --surface-pearl: #fafafc;
  --surface-tile-1: #272729;
  --surface-tile-2: #2a2a2c;
  --surface-tile-3: #252527;
  --surface-black: #000000;
  --surface-chip-translucent: rgba(210, 210, 215, 0.64);
```

面の色が階層を作ります。design.md はカードやボタンに影を付けることを禁じており、「奥行き」は**背景色の切り替わり**と **固定バーの背景ぼかし**だけで表現します。そのため白からほぼ黒まで、細かく刻んだ面色が必要になります。

`--surface-black`（真っ黒）はグローバルナビ専用で、暗いコンテンツタイルの `--surface-tile-1`（#272729）とは別物です。ナビだけが純黒になることで、ページ内容とナビが明確に分離します。

```css
  /* Text */
  --ink: #1d1d1f;
  --ink-muted-80: #333333;
  --ink-muted-48: #7a7a7a;
  --body-on-dark: #ffffff;
  --body-muted: #cccccc;
```

本文色は純黒（#000000）ではなく `#1d1d1f` です。純黒の文字は白背景上でコントラストが強すぎ、長文を読むと目が疲れるため、わずかに灰を含んだ黒を使います。`--ink-muted-48` は補足文・キャプション用で、これ以上薄い色はコントラスト比が不足するため用意していません。

```css
  /* Type families — Apple 環境では system-ui が SF Pro に解決される */
  --font-display: 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-text: 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

Web フォントを読み込まず、OS 標準のフォントに委ねています。Apple 製品では `system-ui` が SF Pro に解決され、Windows では Segoe UI、 Android では Roboto になります。**フォントファイルのダウンロードが発生しない**ので初回表示が速く、書体の差し替えによるレイアウトのちらつき（FOUT）も起きません。

display と text の2系統に分けているのは、Apple のタイポグラフィが見出し用（字間が詰まった SF Pro Display）と本文用（字面が広い SF Pro Text）を使い分けるためです。`base.css` で `h1〜h3` に display、`body` に text を割り当てています。

```sql
  --text-body-size: 17px;
  ...
  --leading-body: 1.47;
  --tracking-body: -0.374px;
```

本文は **16px ではなく 17px** です。これは Apple のタイポグラフィの特徴で、design.md の Principles に明記されています。サイズ・行送り（`line-height`）・字間（`letter-spacing`）は必ず3点セットで使う決まりです。サイズだけ変えて行送りを据え置くと、画面ごとに行間の印象がばらついてしまうためです。

字間が負の値（`-0.374px`）なのは、SF Pro が標準状態ではやや字間が広く見えるためで、わずかに詰めることで締まった見え方になります。

```css
  /* Spacing — 基準 8px */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 17px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-section: 80px;
```

8px を基準にした階段です。`--space-md` だけ 16px ではなく **17px** なのは、本文サイズ（17px）と揃えて「1行分の余白」を作るためで、design.md の値をそのまま写しています。 `--space-section`（80px）はタイルの上下パディングで、 1タイルがほぼ1画面を占める低密度なレイアウトを支えています。

```css
  /* 唯一の影。製品写真のためのもので、カード・ボタン・文字には使わない */
  --shadow-product: rgba(0, 0, 0, 0.22) 3px 5px 30px 0;
```

design.md の Shadow philosophy では、システム全体で影は **ちょうど1つ**しか存在せず、それは製品写真が面の上に乗っている重みを表すためのもの、と定められています。カード・ボタン・文字に影を付けるのは明確な禁止事項です。このアプリには製品写真が無いため実際には未使用ですが、「影はこれ以外に足さない」という制約を可視化するためにトークンとして残しています。

```css
  /* Layout */
  --nav-height: 44px;
  --sub-nav-height: 52px;
  --content-max: 1440px;
  --content-max-reading: 980px;
  --touch-target: 44px;
```

`--nav-height` は `nav.css` のナビ高さであると同時に、サブナビの `position: sticky; top: var(--nav-height)` にも使われます。両方が同じ変数を見ているので、ナビの高さを変えてもサブナビが重なったり隙間が空いたりしません。

`--touch-target`（44px）は Apple のヒューマンインターフェイスガイドラインが定める最小タップ領域です。ボタン（`buttons.css`）と入力欄・チェックボックス行（`forms.css`）がこの値を `min-height` に使い、指で押せる大きさを保証しています。

```css
/* タイル内の縦余白は小さい画面で詰める（design.md の Collapsing Strategy） */
@media (max-width: 735px) {
  :root {
    --space-section: 48px;
  }
}
```

レスポンシブ対応を**トークン側で**行っている点がポイントです。個々のコンポーネントにメディアクエリを書くのではなく、変数の値を差し替えるだけで、`--space-section` を使っているすべての場所（`.section` の上下パディング）が一斉に縮みます。スマートフォンで 80px の余白はスクロール量が増えすぎるため、 48px まで詰めています。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles/tokens.css*
