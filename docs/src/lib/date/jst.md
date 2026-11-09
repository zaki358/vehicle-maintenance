# jst.ts

`src/lib/date/jst.ts`

## 概要

「今日」という 1 つの値を、**日本時間（Asia/Tokyo）基準で**正しく求めるための 1 関数だけのファイルです。このアプリのほぼすべての日付計算（車検の残り日数など）は、最初にこの関数で「今日」を得るところから始まります。

存在理由はただ一つ、**Cloudflare Workers の実行環境が常に UTC であること**への対処です。サーバーが素朴に「今日」を求めると UTC の日付になりますが、利用者は日本にいるため、 UTC と JST の 9 時間のズレが原因で、朝 9 時になるまでサーバーの「今日」が利用者にとっての前日のままになってしまいます。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `JST_FORMATTER` | const（内部） | Asia/Tokyo 固定の `Intl.DateTimeFormat` |
| `todayInJst` | function（export） | 日本時間での「今日」を `DateString` で返す |

## コード解説

```ts
const JST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
```

`Intl.DateTimeFormat` に `timeZone: 'Asia/Tokyo'` を明示すると、実行環境自体のタイムゾーンが何であっても（Workers の UTC でも、開発者の PC の JST でも）、常に日本時間としての年月日を計算してくれます。これがこのファイル全体の仕組みです。

ロケールに `'en-CA'`（カナダ英語）を指定しているのは翻訳のためではなく、 **このロケールの標準的な日付表記がちょうど `YYYY-MM-DD` になる**という実装上の都合です。日本語ロケール（`'ja-JP'`）だと `2026/09/06` のような別形式になってしまい、そのままでは `DateString` の形式（date-string.ts 参照）と一致しません。

```ts
export function todayInJst(now: Date = new Date()): DateString {
  return toDateString(JST_FORMATTER.format(now))
}
```

引数 `now` を省略すると現在時刻を使いますが、 **明示的に渡すこともできる**のがこの関数の重要な設計です。これにより、テストコードは「もし今が 2026年9月6日 の朝9時ちょうどだったら」という特定の瞬間を作って渡せるので、実行するたびに結果が変わってしまう「現在時刻に依存したテスト」を避けられます。

戻り値は `toDateString` を通して `DateString` 型にしています。 `Intl.DateTimeFormat` の出力は理論上つねに正しい形式になりますが、「型としてただの文字列ではなく検証済みの `DateString` である」という保証を呼び出し側に伝えるためにこのひと手間を入れています。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/lib/date/jst.ts*
