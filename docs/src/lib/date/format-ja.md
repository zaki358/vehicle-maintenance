# format-ja.ts

`src/lib/date/format-ja.ts`

## 概要

日付を日本語の画面表示用の文字列に変換する専用ファイルです。「2026年9月6日(日)」のような曜日付きの表示と、「9/6」のような一覧向けの短い表示の 2 種類を提供します。

**Phase 8のコードレビューで、以前このファイルが使っていた `date-fns` の `format()` がタイムゾーン依存のバグを抱えていることが判明し、修正しました。** `format()` は `Date` オブジェクトから **実行環境のローカルタイムゾーンの**年月日・曜日を読み取ります。西経のタイムゾーン（例: アメリカのCIランナー）でこの関数を実行すると、 UTC深夜0時として解釈された日付が「前日」にずれて表示されるおそれがありました（日本国内の開発機や、TZ=UTCのCloudflare Workers上ではズレが顕在化しないため、これまで気づかれていませんでした）。

修正後は `date-fns` を使わず、`Date` の `getUTCFullYear()` / `getUTCMonth()` / `getUTCDate()` / `getUTCDay()` という **UTC 版のゲッターだけ**で年月日・曜日を取り出します。これらは実行環境のタイムゾーン設定に一切左右されないため、どの環境で実行しても入力した日付文字列どおりの結果になります。

**このファイルの関数を計算に使ってはいけません。** 日付の前後比較や加減算は、必ず `date-string.ts` や `add-months.ts` の関数を使います。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `WEEKDAY_JA` | const | 曜日番号（0=日〜6=土）を日本語1文字に対応させる配列 |
| `toUtcParts` | function | `DateString` をUTC基準の年・月・日・曜日に分解する内部ヘルパー |
| `formatJa` | function（export） | 「2026年9月6日(日)」形式。満了日など、しっかり読ませたい場面用 |
| `formatJaShort` | function（export） | 「9/6」形式。記録一覧など、日付を何行も並べる場面用 |

## コード解説

```ts
const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'] as const

function toUtcParts(date: DateString) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
    weekday: WEEKDAY_JA[parsed.getUTCDay()],
  }
}
```

`DateString`（`"2026-09-06"` の形式）の末尾に明示的に `T00:00:00.000Z` を付けて `Date` を作ることで、「UTC深夜0時」という解釈を曖昧さなく固定します。そこから `getUTCFullYear()`・`getUTCMonth()`（0始まりなので+1する）・ `getUTCDate()`・`getUTCDay()`（0=日曜〜6=土曜）という **すべて "UTC" が付くゲッター**だけを使ってフィールドを取り出します。通常版の `getFullYear()` 等（ローカルタイムゾーン版）を 1つでも混ぜると、実行環境によって日付が前後にずれるバグが再発するため、ここが最も注意すべき箇所です。

曜日は `Intl` や `date-fns` のロケール機能に頼らず、 `WEEKDAY_JA` という固定配列への添字アクセスだけで求めています。日本語の曜日は7つしかないので、この程度なら自前配列の方が依存も増えずシンプルです。

```ts
export function formatJa(date: DateString): string {
  const { year, month, day, weekday } = toUtcParts(date)
  return `${year}年${month}月${day}日(${weekday})`
}
```

`toUtcParts` で取り出した値をそのままテンプレートリテラルに埋め込むだけです。`month`・`day` はゼロ埋めしない（日本語表記の慣習どおり「9月6日」であって「09月06日」ではない）ため、ゼロ埋めしないよう気をつける必要はもうありません（`getUTCMonth()+1`・`getUTCDate()` はそもそもゼロ埋めされた文字列を返さない数値なので、自然にそうなります）。

```ts
export function formatJaShort(date: DateString): string {
  const { month, day } = toUtcParts(date)
  return `${month}/${day}`
}
```

整備記録の一覧のように、日付を何行も縦に並べる画面では曜日や年まで出すと画面が窮屈になります。`formatJa` より短い「9/6」形式だけを返す、一覧表示専用の関数です。

---

*生成日: 2026-09-19（Phase 8で date-fns 依存を除去し全面改稿） ／ 対象ファイル: src/lib/date/format-ja.ts*
