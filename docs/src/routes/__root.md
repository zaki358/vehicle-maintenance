# \_\_root.tsx

`src/routes/__root.tsx`

## 概要

すべてのルートの一番外側にある「土台」です。TanStack Router のファイルベースルーティングでは `__root.tsx` が特別扱いされ、ここで定義した `<html>` ／ `<head>` ／ `<body>` の中に、他のすべてのページが描画されます。

役割は大きく2つです。1つは `head()` で `<head>` の中身（文字コード・viewport・タイトル・アイコン・manifest）を宣言すること。もう1つは `shellComponent` で HTML ドキュメントの骨格そのものを組み立てることです。

**ホーム画面アイコンの設定はこのファイルが入口になります。** iPhone や Android でこのアプリを「ホーム画面に追加」したとき、何も指定しないとページのスクリーンショットや頭文字1文字の味気ないアイコンになってしまいます。それを避けるため、 `apple-touch-icon` と Web App Manifest をここから配線しています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `Route` | const（export） | ルートルートの定義。`head()` と `shellComponent` を持つ |
| `Route.head()` | function | `<head>` に出力する `meta` / `link` を返す |
| `RootDocument` | function（component） | HTML ドキュメントの骨格（`html` / `head` / `body`） |

### 関連するファイル

| パス | 説明 |
| --- | --- |
| `public/manifest.webmanifest` | Web App Manifest。アプリ名・テーマ色・アイコン一覧を宣言する |
| `public/apple-touch-icon.png` | 180×180。iOS のホーム画面アイコン |
| `public/icon-192.png` / `icon-512.png` | manifest から参照される通常アイコン |
| `public/icon-maskable-192.png` / `icon-maskable-512.png` | Android の maskable 用。中央 78% にロゴを収めてある |
| `public/favicon.ico` / `favicon-32.png` / `favicon-16.png` | ブラウザのタブに出るアイコン |
| `tools/generate-icons.py` | 上記の画像一式を `image/icon.jpg` から生成するスクリプト |

## コード解説

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [ /* ... */ ],
    links: [ /* ... */ ],
  }),
  shellComponent: RootDocument,
})
```

`createRootRoute` はルートツリーの頂点を作ります。 `head()` が返した `meta` / `links` は、後述の `<HeadContent />` の位置に実際のタグとして描画されます。子ルート側でも `head()` を書くとここの内容にマージされるため、ここには「全ページ共通のもの」だけを置きます。

`appCss` の `?url` は Vite の機能で、CSS を JS にバンドルせずファイルの URL 文字列として取り込むための指定です。こうすることで `<link rel="stylesheet">` として読み込ませ、初回描画時にスタイルが当たっていない状態（FOUC）を避けられます。

```tsx
{
  // ブラウザの上枠・Android のステータスバーの色。上部ナビの黒に合わせる
  name: 'theme-color',
  content: '#000000',
},
{
  // iOS のホーム画面でアイコンの下に出る名前。長いと省略されるので短くする
  name: 'apple-mobile-web-app-title',
  content: 'CAR DOC',
},
{
  name: 'application-name',
  content: 'CAR DOC',
},
```

`theme-color` は、Android の Chrome ではアドレスバーやステータスバー、 iOS の Safari では上下のツールバーの地色に使われます。 `#000000` にしているのは、アプリ上部のナビゲーション（`src/styles/nav.css` の `.nav`、`--surface-black`）が真っ黒なバーだからです。同じ色にしておくと、ブラウザのUIとアプリのナビが 1枚の黒い帯として繋がって見えます。

`apple-mobile-web-app-title` は iOS のホーム画面でアイコンの下に表示されるラベルです。これを書かないと `<title>` の「車両メンテナンス記録」がそのまま使われますが、ホーム画面のラベルは十数文字で省略されてしまいます。アイコンの絵柄（CAR DOC）と揃えた短い名前にしています。

```tsx
// iOS はここだけを見る。manifest の icons は参照しない
{
  rel: 'apple-touch-icon',
  sizes: '180x180',
  href: '/apple-touch-icon.png',
},
```

**ここがホーム画面アイコン対応の要です。** iOS の Safari は Web App Manifest の `icons` を読みません。ホーム画面に追加するときに見るのは `rel="apple-touch-icon"` だけで、これが無い場合はページのスクリーンショットを縮小したものが使われます。つまり manifest だけ用意しても iPhone では効きません。

画像は **角を丸めずに全面を塗った正方形**にしてあります。 iOS はアイコンに自前で角丸（スクイーカル）マスクをかけるため、こちら側で角を丸めると二重に丸まって縁に隙間が出るためです。 180×180 なのは、iPhone の標準的なホーム画面アイコンの解像度に合わせたものです（OS 側が必要なサイズへ縮小してくれます）。

```tsx
{
  rel: 'icon',
  type: 'image/png',
  sizes: '32x32',
  href: '/favicon-32.png',
},
{
  rel: 'icon',
  type: 'image/png',
  sizes: '16x16',
  href: '/favicon-16.png',
},
{
  rel: 'icon',
  href: '/favicon.ico',
  sizes: '48x48',
},
{
  rel: 'manifest',
  href: '/manifest.webmanifest',
},
```

PNG の favicon を 2 サイズ並べているのは、ブラウザが表示環境（通常のタブ／高解像度ディスプレイ／ブックマークバー）に応じて一番近いサイズを選べるようにするためです。 `favicon.ico` も残してあるのは、`<link>` を一切見ずに `/favicon.ico` を直接取りに行く古いブラウザやクローラーがあるためのフォールバックです。

`rel="manifest"` が Web App Manifest への入口です。 Android の Chrome はこれを読んで、ホーム画面アイコン・アプリ名・起動時の背景色を決めます。

```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
```

`shellComponent` として登録されるコンポーネントで、 HTML ドキュメントそのものを返します。通常の React アプリのように `index.html` が別にあるのではなく、TanStack Start ではこの関数がサーバーサイドレンダリングの出力全体になります。

`<HeadContent />` は、ルートと子ルートの `head()` が返した内容をここに差し込むプレースホルダです。 `<Scripts />` はクライアント側の JS バンドルの `<script>` タグを出力します。`{children}` の後ろに置くのは、本文の描画をスクリプトの読み込みでブロックしないためです。

`lang="ja"` はスクリーンリーダーの読み上げ言語やブラウザの翻訳提案の判断に使われます。

## public/manifest.webmanifest

`rel="manifest"` から参照される設定ファイルです。主に Android の Chrome が読みます（iOS は前述のとおり参照しません）。

```json
{
  "name": "車両メンテナンス記録",
  "short_name": "CAR DOC",
  "description": "車とバイクの整備記録・車検管理",
  "lang": "ja",
  "dir": "ltr",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f5f5f7",
  "theme_color": "#000000",
  "icons": [ /* ... */ ]
}
```

`name` はインストール確認ダイアログなどに出る正式名称、 `short_name` はホーム画面のアイコン下に出る短い名前です。 iOS 側の `apple-mobile-web-app-title` と同じ「CAR DOC」に揃えています。

`background_color` の `#f5f5f7` は `src/styles/tokens.css` の `--canvas-parchment`、つまりアプリ本体の地の色と同じ値です。起動直後にコンテンツが描画されるまでの一瞬この色で塗られるため、揃えておくと白い画面がちらつきません。

`display: "standalone"` は Android でインストールしたときにブラウザのUIを隠してネイティブアプリのように起動する設定です。 iOS では `display` は無視され、代わりに `apple-mobile-web-app-capable` という meta タグが同じ役割を持ちますが、 **あえて入れていません**。iOS のスタンドアロンモードは Safari と別のストレージ領域を使うため、招待メール・パスワード再設定メールのリンク（Safari で開く）で設定したセッションがホーム画面アプリ側に引き継がれない、という問題を避けるためです。

```tsx
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

`purpose` が `"any"` と `"maskable"` の 2種類あるのは、Android がアイコンを加工する方法が2通りあるためです。 `any` はそのまま表示される想定、`maskable` は端末ごとに違う形（丸・角丸・雫型など）に切り抜かれる想定です。

切り抜きで保証されるのは中央 80% の範囲だけなので、 maskable 版はロゴを中央 78%（`SAFE_ZONE`）に縮めて配置し、周囲を余白で埋めてあります。これを用意しないと、Android が `any` のアイコンを勝手に縮小して白い枠を付けた「白縁のシール」のような見た目になってしまいます。

## tools/generate-icons.py

`image/icon.jpg` から `public/` のアイコン一式を作り直すスクリプトです。元絵を差し替えたときに `python tools/generate-icons.py` を実行すれば全サイズが揃います。

```tsx
# 青い角丸スクエアの位置（元画像 1024x1024 を走査して実測）
RECT = (255, 256, 769, 769)
# 内接正方形の余白。角丸半径 104 に対する幾何的な下限は 31 だが、
# 縁に沿う明るいリムと JPEG のにじみを避けるため 40 まで寄せる
INSET = 40
```

元画像には注意点があります。一見すると背景が透過しているように見えますが、実際は**「透過を表す市松模様」がそのまま描き込まれた JPEG** で、アルファチャンネルはありません。そのため、青い角丸スクエアの領域を座標で切り出す必要があります。`RECT` はその位置を画素走査で実測した値です。

切り出すのは角丸スクエアそのものではなく、**それに内接する正方形**です。角丸のまま切ると四隅に市松模様が残るので塗り足しが必要になりますが、グラデーションを人工的に延長すると継ぎ目が目立ちます（実際に2次曲面で近似を試みたところ、境界に約10階調の段差が出ました）。内接部分だけを使えば全画素が元画像そのままなので、継ぎ目が原理的に発生しません。ロゴの周囲には十分な余白があるため、切り落としても絵柄は欠けません。

```tsx
def with_safe_zone(master: Image.Image) -> Image.Image:
    size = master.size[0]
    pad = round(size * (1 / SAFE_ZONE - 1) / 2)
    padded = np.pad(np.asarray(master), ((pad, pad), (pad, pad), (0, 0)), mode="edge")
    return Image.fromarray(padded).resize((size, size), Image.LANCZOS)
```

maskable 用の余白を作る処理です。`np.pad` の `mode="edge"` は端の画素をそのまま外側へ複製します。新しく色を作らず既存の端の色を引き伸ばすだけなので、こちらも継ぎ目が出ません。背景が縦方向のなだらかなグラデーションなので、端の複製でも不自然に見えない、という前提に乗っています。

---

*生成日: 2026-09-20 ／ 対象ファイル: src/routes/\_\_root.tsx（付随: public/manifest.webmanifest, tools/generate-icons.py）*
