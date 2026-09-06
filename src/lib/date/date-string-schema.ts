import { z } from 'zod'

import { isDateString } from './date-string'

/**
 * 文字列を検証し、実在する `YYYY-MM-DD` 形式の `DateString` へ絞り込む Zod スキーマ。
 *
 * `isDateString` を直接呼ぶことで、日付演算側（date-string.ts）と
 * 検証ルールが1箇所に集約される。車検満了日・整備記録の実施日など、
 * 日付を入力に含むすべてのフォームスキーマがこれを共有する。
 *
 * `.refine()` ではなく `.transform()` を使うのは、検証を通過した値を
 * `DateString`（ブランド型）として扱いたいため。`isDateString` は
 * 型ガードなので、`if` を通過した後の `return value` は自動的に
 * `DateString` 型として推論される。
 */
export const dateStringSchema = z.string().transform((value, ctx) => {
  if (!isDateString(value)) {
    ctx.addIssue({ code: 'custom', message: '日付は YYYY-MM-DD 形式で、実在する日付を指定してください' })
    return z.NEVER
  }
  return value
})
