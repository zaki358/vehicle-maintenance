type PartDetailRecord = { partDetail: string }

/**
 * 過去の整備記録から「部品/型式」欄のサジェスト候補を作る。
 *
 * 重複は除き、渡された配列の登場順を保つ（呼び出し側が新しい順に並べていれば
 * 最近使った値ほど先に出る）。`query` を渡すとその文字列を含むものだけに絞り込む。
 */
export function partSuggestions<T extends PartDetailRecord>(records: readonly T[], query = ''): string[] {
  const trimmedQuery = query.trim()
  const seen = new Set<string>()
  const suggestions: string[] = []

  for (const record of records) {
    const detail = record.partDetail.trim()
    if (detail === '' || seen.has(detail)) {
      continue
    }
    if (trimmedQuery !== '' && !detail.includes(trimmedQuery)) {
      continue
    }
    seen.add(detail)
    suggestions.push(detail)
  }

  return suggestions
}
