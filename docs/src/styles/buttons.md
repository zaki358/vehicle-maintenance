# buttons.css

`src/styles/buttons.css`

## 概要

ボタンのスタイルです。design.md の Buttons が定める文法は **ピル型の主ボタン・輪郭だけの副ボタン・小さな実務ボタン**の 3つだけで、このファイルもそれに従います（加えてカード内用の `.btn-pearl` を派生として持ちます）。

特徴は**ホバー状態を定義しない**ことです。Apple のボタンはマウスを乗せても色が変わらず、押した瞬間だけ `scale(0.95)` でわずかに縮みます。タッチ操作にホバーが存在しないことを前提にした設計で、マウスとタッチで挙動が食い違いません。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `.btn` | 基底クラス | 全ボタン共通の寸法・書体・押下アニメーション |
| `.btn:active` / `:disabled` / `:hover` | 状態 | 押下で縮小、無効で淡色、ホバーは何もしない |
| `.btn-primary` | 修飾クラス | 青のフルピル。主要アクション |
| `.btn-secondary` | 修飾クラス | 青の輪郭だけのゴーストピル |
| `.btn-utility` | 修飾クラス | ナビ内の小さな実務ボタン |
| `.nav .btn-utility` | 文脈上書き | 黒背景では輪郭だけの淡色に |
| `.btn-pearl` | 修飾クラス | カード内の控えめな第2アクション |
| `.btn-row` | クラス | 横並びのアクション群。狭い画面では全幅 |

## コード解説

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  border: none;
  font-family: var(--font-text);
  font-size: var(--text-body-size);
  line-height: 1;
  letter-spacing: var(--tracking-body);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.12s ease-out;
}
```

`inline-flex` と中央揃えにより、`<button>` でも `<a>`（TanStack Router の `<Link>`）でも同じ見た目になります。ボタンに見えるリンクとリンクに見えるボタンが混在しても、寸法と文字位置が揃います。

`font-family` をわざわざ指定しているのは、フォーム要素が `body` のフォントを自動では継承せず、ブラウザ既定のフォントになってしまうためです。

`min-height: var(--touch-target)`（44px）で最小タップ領域を保証します。`line-height: 1` にしているのは、本文の 1.47 のままだとパディングと合算して意図より背が高くなるからです。

```css
.btn:active:not(:disabled) {
  transform: scale(0.95);
}

.btn:disabled {
  color: var(--ink-muted-48);
  cursor: not-allowed;
}

.btn:hover {
  text-decoration: none;
}
```

押下フィードバックは全種類共通で `scale(0.95)`。 `:not(:disabled)` を付けているので、無効化されたボタンを押しても縮まず、「押せなかった」ことが伝わります。

`.btn:hover` が `text-decoration: none` だけなのは、 `base.css` の `a:hover` が下線を付けてしまうのを打ち消すためです。**ホバーで見た目を変えない**という design.md の方針を守るために、あえて「何も起きない」を明示しています。

```css
/* 主要アクション。青のフルピル＝「押せる」の合図 */
.btn-primary {
  padding: 11px 22px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:disabled {
  background: var(--hairline);
}
```

完全な角丸（`--radius-pill` = 9999px）の青いピルが、このシステムで最も強い「押せる」の合図です。1画面に1つだけ置くのが原則で、「保存する」「車両を追加」などがこれにあたります。

無効時は背景を淡いグレー（`--hairline`）に落とします。基底クラス側で文字色も `--ink-muted-48` になるため、グレー地にグレー文字という控えめな見た目になり、青と明確に区別できます。

```css
/* 2つ目のCTA。青の輪郭だけのゴーストピル */
.btn-secondary {
  padding: 11px 22px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-primary);
}
```

主ボタンと同じ形・同じ色でありながら、塗りを抜くことで格を1段下げます。第2のアクセント色を足さずに優先度の差を作る、というのが design.md の考え方です（「押せる」の信号はすべてこの青ひとつ）。

```css
/* ナビ内の小さな実務アクション（ログアウト等） */
.btn-utility {
  min-height: 32px;
  padding: 8px 15px;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: var(--body-on-dark);
  font-size: var(--text-caption-size);
  letter-spacing: var(--tracking-caption);
  /* ラベルを折り返させない。折り返すと高さが伸びて 44px のナビが崩れる */
  white-space: nowrap;
}
```

ピルではなく **8px の角丸**の小さな箱で、ログアウトのような事務的な操作に使います。`min-height` を 32px に落として 44px の原則から外れていますが、これは design.md が「グローバルナビのユーティリティリンクは、精密なデスクトップ操作であることを理由に意図的に小さい」と明記している箇所に沿ったものです。

`white-space: nowrap` は**高さを守るための指定**です。これが無いと、幅の足りない画面でラベルが「ログア／ウト」と2行に折り返し、ボタンの高さが 32px から伸びて、その分 `.nav` の `min-height: 44px` を押し広げてしまいます（黒バーだけが不自然に分厚くなる）。ボタンは**幅で調整して高さは固定**、という原則をここで担保しています。

```css
/* 黒背景のナビ上では ink が沈むため、輪郭だけの淡色にする */
.nav .btn-utility {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
```

`--ink`（#1d1d1f）の箱を純黒のナビに置くと、色が近すぎてボタンの輪郭が消えます。そこでナビの中でだけ塗りを抜き、半透明の白い枠に差し替えます。`.nav` を前置した **文脈依存の上書き**なので、新しいクラス名を増やさずに済みます。

```css
/* カード内の控えめな第2アクション */
.btn-pearl {
  min-height: 36px;
  padding: 8px 14px;
  border: 3px solid var(--divider-soft);
  border-radius: var(--radius-md);
  background: var(--surface-pearl);
  color: var(--ink-muted-80);
  font-size: var(--text-caption-size);
  letter-spacing: var(--tracking-caption);
}
```

車両カードの「編集」「記録を見る」など、カード内に複数並ぶ操作用です。枠線が **3px** と太いのは、design.md が `divider-soft` を「硬い線というよりリングシャドウとして働く」トーンと位置づけているためで、極薄の色を厚く敷くことで影を使わずに柔らかい縁取りを作っています。

```css
/* 横並びのアクション群 */
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

@media (max-width: 480px) {
  .btn-row > .btn {
    flex: 1 1 100%;
  }

  /* 狭い画面ではナビの文字サイズ（fine）に合わせて詰め、黒バーの一行に収める */
  .btn-utility {
    padding: 6px 10px;
    font-size: var(--text-fine-size);
    letter-spacing: var(--tracking-fine);
  }
}
```

複数ボタンを横に並べる入れ物です。`flex-wrap: wrap` により入りきらなければ自然に折り返します。

480px 以下では `flex: 1 1 100%` で各ボタンを全幅にし、縦積みにします。狭い画面で小さなボタンが肩を並べると押し間違いが起きやすいため、1行1操作にして誤タップを防ぎます。

同じ境界で `.btn-utility` も詰めます。文字を 14px → 12px、左右パディングを 15px → 10px にすることで、ボタン幅は 82.5px → 65.6px になり、アプリ名を省略せずに黒バーへ収まるようになります。 12px は隣の `.nav-link`（ダッシュボード・車両）と同じサイズなので、 **狭い画面ではログアウトだけが大きく浮いて見える問題**も同時に解消します。`min-height: 32px` は据え置きなので、タップ領域の高さは変わりません。

このセレクタが効くのはナビのログアウトボタンだけです（`.btn-utility` の使用箇所は `app-nav.tsx` の1か所のみ）。

---

*生成日: 2026-09-20（スマホ幅のユーティリティボタン調整を反映） ／ 対象ファイル: src/styles/buttons.css*
