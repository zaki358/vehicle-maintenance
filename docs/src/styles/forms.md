# forms.css

`src/styles/forms.css`

## 概要

入力フォームのスタイルです。ラベル・入力欄・補足文・エラー表示・入力群のレイアウトをまとめています。

**design.md はフォームの状態を定義していません** （仕様書の Known Gaps に挙げられています）。参照元が製品紹介ページ中心で、入力フォームがほとんど登場しないためです。そこでこのファイルは、記録アプリに必要な分だけを**既存の文法の内側で**決めています: ラベルは caption-strong、入力欄は Pearl カプセルと同じ 11px 角丸、高さは最小タッチターゲット 44px、フォーカスは既存の青いリング。新しい色やサイズは一切足していません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `.field` | クラス | 1入力項目のまとまり |
| `.field-control` | クラス | 補足文を label の外に置くための入れ物 |
| `.field-label` / `.field-hint` | クラス | ラベルと補足文 |
| `.field-input / -select / -textarea` | クラス | 入力欄本体 |
| `.field-compact` | 修飾クラス | 絞り込みなど単独入力の幅制限 |
| `.field-check` | クラス | チェックボックス行 |
| `.form-stack` / `.form-grid` | クラス | 入力群の縦積み／グリッド |
| `.alert` | クラス | エラー表示（暗いタイル） |
| `.notice` | クラス | 注意喚起未満の補助メッセージ |

## コード解説

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

/*
 * 補足文（.field-hint）を <label> の外に置くための入れ物。
 * label の中に入れると読み上げ時にラベル名の一部として読まれてしまう。
 */
.field-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}
```

**このファイルで最も重要な設計判断です。** 補足文を `<label>` の内側に書くと、その文言が **アクセシブルネーム（読み上げ名）の一部**になります。たとえば「走行距離」というラベルに「半角数字で入力してください」という補足を入れ子にすると、スクリーンリーダーはフィールド名を「走行距離 半角数字で入力してください」と読み上げてしまい、フォーム内を項目名で拾い読みするのが難しくなります。

そこで `<label>` には短いラベル文言だけを入れ、補足文は label の兄弟要素として `.field-control` の中に置きます。見た目の積み上げ（ラベル → 補足 → 入力欄）は `.field` と `.field-control` の2段フレックスで作るため、マークアップの正しさと見た目の両方が成立します。

```css
.field-label {
  font-size: var(--text-caption-size);
  font-weight: 600;
  line-height: 1.29;
  letter-spacing: var(--tracking-caption);
  color: var(--ink);
}

.field-hint {
  font-size: var(--text-fine-size);
  letter-spacing: var(--tracking-fine);
  color: var(--ink-muted-48);
}
```

ラベルは 14px の太字（caption-strong）で、本文より小さくしつつ太さで存在感を出します。補足文はさらに小さい 12px、色も `--ink-muted-48` に落として階層を作ります。 **色で目立たせる**のではなく、サイズ・太さ・明度だけで 3段階（ラベル → 入力内容 → 補足）を区別しているのが要点です。

```css
.field-input,
.field-select,
.field-textarea {
  width: 100%;
  min-height: var(--touch-target);
  padding: 12px 16px;
  border: 1px solid var(--hairline-soft);
  border-radius: var(--radius-md);
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-text);
  font-size: var(--text-body-size);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
}

.field-textarea {
  min-height: 96px;
  resize: vertical;
}
```

3種類の入力欄を同じ寸法・同じ角丸（11px = Pearl カプセルと同値）に揃えています。これにより `<select>` だけ見た目が浮く、といったズレが起きません。

`font-size` が本文と同じ **17px** であることには実用上の意味があります。iOS Safari は 16px 未満の入力欄にフォーカスすると画面を自動でズームするため、16px 以上にしておくとタップのたびに拡大される不快な挙動を避けられます。

`resize: vertical` は、テキストエリアを横方向に広げてレイアウトを壊されるのを防ぎつつ、縦方向の調整は利用者に許す設定です。

```css
.field-input:focus-visible,
.field-select:focus-visible,
.field-textarea:focus-visible {
  outline: 2px solid var(--color-primary-focus);
  outline-offset: 0;
  border-color: transparent;
}
```

`base.css` の共通フォーカスリングは `outline-offset: 2px` ですが、入力欄では 0 に戻します。枠線を持つ要素で外側に離すと、既存の枠とリングが二重の輪に見えてしまうためです。

さらに `border-color: transparent` で元の枠線を透明にし、青いリングだけが見えるようにします。`border` 自体は残っているので要素の寸法は変わらず、フォーカスした瞬間に入力欄が数ピクセル動く（レイアウトシフト）ことがありません。

```css
/* 絞り込みなど、単独で置く入力は横幅を広げすぎない */
.field-compact {
  max-width: 320px;
}

/* チェックボックスは行全体を押せるようにする */
.field-check {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--touch-target);
  font-size: var(--text-body-size);
}

.field-check input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}
```

チェックボックス行は `<label>` として書かれる想定で、 `min-height: 44px` を与えることで、小さな四角そのものではなく **行全体がタップ領域**になります。20px のチェックボックスを指で正確に押すのは難しいため、これが実際の押しやすさを決めます。

`accent-color` はブラウザ標準のチェックボックスのチェック色だけを差し替えるプロパティです。見た目を自前で作り直すとキーボード操作や読み上げの挙動まで再実装する必要が出るため、標準部品のまま色だけ合わせる方が安全です。

```css
.form-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* 狭い画面では1列、広い画面では2列に流す入力群 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 641px) {
  .form-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}
```

`.form-grid` は既定が1列で、`min-width` のメディアクエリで2列に**広げる**形です。狭い画面を出発点にする（モバイルファースト）ことで、メディアクエリが効かない環境でも必ず1列という安全側に倒れます。

2列化は `.form-grid-2` を併記したときだけ起こるので、「年式と型式は横並び、備考は全幅」といった使い分けができます。

```css
/* 入力エラー。色を増やさず、太字＋ダークタイルで注意を示す */
.alert {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--surface-tile-1);
  color: var(--body-on-dark);
  font-size: var(--text-caption-size);
  ...
}

.alert a { color: var(--color-primary-on-dark); }
```

**エラーが赤くない理由** — design.md は「第2のアクセント色を導入してはならない。押せる合図はすべて青」と定めており、赤を足すことはその禁止に触れます。代わりに **暗いタイル**を使い、周囲の明るい面との明度差で視線を引きます。色覚に依存しない手掛かりなので、アクセシビリティの観点でもむしろ有利です。

暗い面の上に置くリンクは `--color-primary-on-dark` （明るい青）へ差し替えます。通常の `#0066cc` のままだとコントラストが不足するためです。

このクラスは `AppNav` のログアウト失敗メッセージや、各フォームの検証エラーで使われ、いずれも `role="alert"` を付けた要素に当てられます。

```css
/* 注意喚起までは要らない補助メッセージ（走行距離の逆行警告など） */
.notice {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface-pearl);
  color: var(--ink-muted-80);
  ...
}
```

エラーではないが伝えたい情報のための、明るく静かな箱です。たとえば「前回より走行距離が減っています」のような、入力を止めるほどではない指摘に使います。 `.alert`（暗い）と `.notice`（明るい）という面の明暗だけで深刻度の2段階を表現しており、ここでも色は増やしていません。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/styles/forms.css*
