# date-string.ts

`src/lib/date/date-string.ts`

## 概要

「日付だけ」（時刻を持たない日付）を安全に扱うための型と演算をまとめたファイルです。車検の満了日や整備した日など、このアプリが扱う日付はすべて時刻を持ちません。

このファイルが存在する理由は、**タイムゾーンによる 1 日のズレを根本から断つため**です。このアプリは Cloudflare Workers 上で動きますが、Workers のタイムゾーンは常に UTC で、利用者のスマホは JST（UTC+9）です。つまり毎日 00:00〜09:00 JST の 9 時間は、サーバーが考える「今日」と利用者が考える「今日」が 1 日ずれます。

加えて JavaScript の `new Date('2026-09-06')` は、仕様上 UTC の深夜0時として解釈されます。この 2 つが噛み合うと、**「車検まであと 31 日」と表示された画面が、直後に 30 日へ書き換わる**という現象が起きます。React は警告を出さないため気づけません。

対策として、この層では **Date インスタンスを原則として作らず**、 `YYYY-MM-DD` という文字列と整数の計算だけでカレンダー演算を行います。日本語での表示整形（「2026年9月6日(土)」など）は別ファイル（format-ja.ts）に隔離します。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `DateString` | type（export） | 検証済みの `YYYY-MM-DD` 文字列を表すブランド型 |
| `isDateString` | function（export） | 形式と実在性を判定する型ガード |
| `toDateString` | function（export） | 検証して `DateString` に変換。不正なら例外 |
| `toUtcMillis` | function（export） | UTC 深夜0時基準のミリ秒（通日番号として使う） |
| `daysBetween` | function（export） | 2 日付の間の日数。過去なら負の数 |
| `isOnOrAfter` | function（export） | 同日を含めて以降かを判定 |
| `isOnOrBefore` | function（export） | 同日を含めて以前かを判定 |
| `isLeapYear` | function（内部） | うるう年判定 |
| `daysInMonth` | function（内部） | その年月の日数を返す |
| `split` | function（内部） | 文字列を年・月・日の数値に分解 |

## コード解説

```ts
export type DateString = string & { readonly __brand: 'DateString' }

const PATTERN = /^\d{4}-\d{2}-\d{2}$/
```

`DateString` は「検証を通過した日付文字列」を表す型です。実体はただの文字列ですが、 `__brand` という架空のプロパティを型の上でだけ付け足すことで、 **普通の `string` を代入できなくしています**（ブランド型と呼ばれる手法）。

これにより、DB から来た生の文字列やユーザーが入力した文字列が、検証を通らずに計算へ流れ込むのを型検査の段階で止められます。また `YYYY-MM-DD` はゼロ埋めが保証されるため、 **辞書順の文字列比較がそのまま日付の前後比較として使える**という利点もあります。

```ts
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

const MILLIS_PER_DAY = 86_400_000

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

月ごとの日数を求める内部関数です。うるう年の判定は「4 で割り切れる、ただし 100 で割り切れる年は除く、ただし 400 で割り切れる年は含む」という正式な規則をそのまま実装しています（2000 年はうるう年、1900 年は違う）。

ここで `Date` を使わず自前で計算しているのは、このファイルの方針である「カレンダー計算に `Date` を持ち込まない」を貫くためです。整数演算だけなので、実行環境のタイムゾーンに一切影響されません。

```ts
type DateParts = { year: number; month: number; day: number }

function split(date: string): DateParts {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  }
}
```

`"2026-09-06"` を `{ year: 2026, month: 9, day: 6 }` に分解します。位置が固定されている前提で `slice` しているのは、呼び出し前に必ず正規表現で形式を確認しているためです。

```ts
export function isDateString(value: string): value is DateString {
  if (!PATTERN.test(value)) {
    return false
  }
  const { year, month, day } = split(value)
  if (month < 1 || month > 12) {
    return false
  }
  return day >= 1 && day <= daysInMonth(year, month)
}
```

形式が `YYYY-MM-DD` であることに加えて、**実在する日付かどうかまで判定します**。戻り値の型が `value is DateString` になっているため、この関数が `true` を返した後は TypeScript が自動的に型を `DateString` として扱います。

実在性まで見るのが重要な点です。`2026-02-30` や `2026-02-29`（2026 年はうるう年ではない）は形式上は正しく見えますが、通してしまうと後続の計算結果が静かにずれます。「なぜか車検の残り日数がおかしい」という追いにくいバグの発生源になるため、ここで弾きます。

```ts
export function toDateString(value: string): DateString {
  if (!isDateString(value)) {
    throw new Error(`日付として解釈できません: ${value}（YYYY-MM-DD 形式で、実在する日付である必要があります）`)
  }
  return value
}
```

検証を通したうえで `DateString` に変換します。不正な値では **例外を投げます**。

`null` を返したりデフォルト値で誤魔化したりしないのは意図的です。不正な日付が混入したまま計算が続くと、エラーは出ないのに結果だけが間違うという最も追いにくい種類のバグになります。ここで止めて、原因の場所で気づけるようにします。

```ts
export function toUtcMillis(date: DateString): number {
  const { year, month, day } = split(date)
  const millis = Date.UTC(year, month - 1, day)

  if (year < 100) {
    const corrected = new Date(millis)
    corrected.setUTCFullYear(year)
    return corrected.getTime()
  }
  return millis
}
```

日付を「UTC 深夜0時からのミリ秒」に変換します。これは**時刻として使う値ではなく、日数を数えるための通し番号として使う値**です。両辺とも UTC の深夜0時に揃うため、差を取れば夏時間もタイムゾーンも介在せず、正確な日数になります。

後半の `if (year < 100)` は `Date.UTC` の仕様への対処です。 `Date.UTC(26, 0, 1)` は 26 年ではなく **1926 年**として解釈されます。正規表現が 4 桁の年を許すため `0026-01-01` のような値が届く可能性があり、 `setUTCFullYear` で明示的に補正しています。実用上まず起きませんが、静かに 1900 年ずれるより明示的に潰すほうが安全です。

```ts
export function daysBetween(from: DateString, to: DateString): number {
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / MILLIS_PER_DAY)
}
```

2 つの日付の間の日数を返します。`to` が過去の場合は負の数になります。 **車検の残り日数はこの関数で求めます**。0 なら当日が満了日、負なら期限切れです。

`Math.round` は本来不要です（両辺とも深夜0時なので割り算は必ず割り切れます）が、浮動小数点演算の誤差に対する保険として付けています。

```ts
export function isOnOrAfter(date: DateString, other: DateString): boolean {
  return date >= other
}

export function isOnOrBefore(date: DateString, other: DateString): boolean {
  return date <= other
}
```

日付の前後を比較します。中身は単なる文字列比較です。これが正しく動くのは、`YYYY-MM-DD` が**固定長でゼロ埋めされている**ため、辞書順が日付順と一致するからです（`"2025-12-31" < "2026-01-01"`）。

わざわざ関数にしているのは可読性のためです。コードの中に `a >= b` と書かれていても日付の比較だと読み取りにくいですが、`isOnOrAfter(today, expiry)` なら意図が明確になります。また、この関数を経由させることで「比較していい値は検証済みの `DateString` だけ」という制約も型で効かせられます。

---

*生成日: 2026-09-06 ／ 対象ファイル: src/lib/date/date-string.ts*
