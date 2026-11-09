# delete.ts

`src/features/maintenance/server/delete.ts`

## 概要

整備記録を削除するサーバー関数です。車両詳細ページの記録一覧から、各行の削除ボタン経由で呼ばれます。`vehicles/server/delete.ts` とほぼ同じ形をしています。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `DeleteRecordDeps` | interface | ハンドラが必要とする Supabase クライアントの最小インターフェース |
| `deleteRecordHandler` | async function（export） | 指定IDの整備記録を削除する純粋なハンドラ |
| `deleteRecordFn` | const（export） | `createServerFn` でラップした実HTTPエンドポイント |

## コード解説

```ts
export async function deleteRecordHandler(input: RecordIdInput, deps: DeleteRecordDeps): Promise<void> {
  const { error } = await deps.supabase.from('maintenance_records').delete().eq('id', input.id)
  if (error) {
    throw new Error(error.message)
  }
}
```

存在しない・他人の記録を指定してもRLSが対象行を0件にするだけでエラーにはなりません（`vehicles/server/delete.ts` と同じ、副作用のない no-op として扱う設計）。`maintenance_records` はどのテーブルからも参照されないリーフのテーブルなので、`vehicles` の削除のようなカスケード削除の考慮は不要です。

```ts
export const deleteRecordFn = createServerFn({ method: 'POST' })
  .validator(recordIdSchema)
  .handler(({ data }) => deleteRecordHandler(data, { supabase: createSupabaseServerClient() }))
```

入力の検証は `recordIdSchema`（`{ id: uuid }`）だけで十分です。更新のように内容を渡す必要がないため、合成スキーマは不要です。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/server/delete.ts*
