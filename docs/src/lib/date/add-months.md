# add-months.ts

`src/lib/date/add-months.ts`

## 概要

日付に「〇ヶ月後」「〇年後」を加算するための関数を提供します。車検の更新は「満了日の2年後」「3年後」を計算する処理そのものなので、このファイルは車検ドメインの計算（features/shaken/lib/renewal.ts）を支える土台になります。

中心的な課題は**「月末のクランプ」**です。たとえば 1月31日 の1ヶ月後を素朴に考えると 2月31日ですが、2月にそんな日は存在しません。このファイルはそうした場合に、自動的にその月の末日（2月なら28日、うるう年なら29日）に丸めます。

JavaScript の `Date.setMonth()` はこの丸めをしてくれず、 1月31日 の1ヶ月後を「3月3日」のように月を繰り越して返してしまいます。そのためこのファイルでは `Date` を使わず、年・月・日を数値として直接計算しています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `addMonths` | function（export） | 指定した月数を加算（月末クランプあり） |
| `addYears` | function（export） | 指定した年数を加算（`addMonths` の薄いラッパー） |
| `isLeapYear` | function（内部） | うるう年判定 |
| `daysInMonth` | function（内部） | 指定した年月の日数 |
| `pad2` | function（内部） | 1桁の数値を2桁のゼロ埋め文字列にする |
| `format` | function（内部） | 年・月・日から `DateString` を組み立てる |

## コード解説

```ts
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  return DAYS_IN_MONTH[month - 1]
}
```

月ごとの日数を求める内部関数です。2月だけはうるう年かどうかで日数が変わるため、特別扱いしています。`date-string.ts` にも同じ内容の実装がありますが、意図的に重複させています。それぞれのファイルが外部のモジュールに依存せず単独でテストできる状態を保つためです。

```ts
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function format(year: number, month: number, day: number): DateString {
  return `${year}-${pad2(month)}-${pad2(day)}` as DateString
}
```

年・月・日の数値から `"2026-09-06"` のような文字列を組み立てます。月と日を2桁ゼロ埋めするための小さなヘルパーです。

`as DateString` で型を強制しているのは、この関数の中でだけ許される操作です。計算した年月日が既に妥当な範囲（`daysInMonth` でクランプ済み）であることが呼び出し元で保証されているため、ここでは再検証をせずに直接キャストしています。

```ts
export function addMonths(date: DateString, monthsToAdd: number): DateString {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))

  const totalMonths = year * 12 + (month - 1) + monthsToAdd
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1

  const clampedDay = Math.min(day, daysInMonth(newYear, newMonth))

  return format(newYear, newMonth, clampedDay)
}
```

このファイルの中核です。手順は次の3段階です。

**1. 月を「通し番号」に変換する。** 「2026年1月」を `2026 × 12 + 0 = 24312` のような 1 つの整数として扱うと、年をまたぐ繰り上がり・繰り下がりを気にせず、単純な足し算・引き算だけで月の加減算ができます。

**2. 通し番号を年と月に戻す。** `Math.floor(totalMonths / 12)` で年、 `(totalMonths % 12) + 1` で月（1〜12）を復元します。負の数を渡しても（過去に戻る場合）`Math.floor` と正の剰余が正しく機能するように意図的に選んでいます。

**3. 日をクランプする。** `Math.min(day, daysInMonth(newYear, newMonth))` が肝心の処理です。「元の日」と「加算先の月の最大日数」の小さいほうを採用することで、 1月31日の1ヶ月後が2月31日という存在しない日付にならず、自動的に2月28日（またはうるう年なら29日）に収まります。

```ts
export function addYears(date: DateString, yearsToAdd: number): DateString {
  return addMonths(date, yearsToAdd * 12)
}
```

年の加算は「12ヶ月をその年数分」加算するのと同じなので、 `addMonths` をそのまま利用しています。

あえて別関数として公開しているのは、車検更新のコードを読むときに `addYears(expiry, 2)` と書けたほうが「2年後」という意図が一目で伝わるためです。`addMonths(expiry, 24)` でも同じ結果になりますが、読み手が暗算する必要がなくなります。

月末クランプの挙動もそのまま引き継がれます。たとえば `2024-02-29`（うるう年の2月29日）の1年後は、2025年がうるう年ではないため `2025-02-28` にクランプされます。これは車検の実務にも合致する挙動です（うるう日に受検した車両の次回満了日は、平年であれば2月28日になる）。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/lib/date/add-months.ts*
