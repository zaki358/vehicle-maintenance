# list-all.ts

`src/features/maintenance/server/list-all.ts`

## 概要

ログイン中ユーザーの整備記録を、車両を問わず全件取得するサーバー関数です。 Phase 7 のダッシュボード（`dashboard/lib/build-summary.ts`）が、「車両ごとの現在の走行距離」「最終整備日」を車両横断で集計するために必要になり、新設しました。

既存の `list.ts` は `vehicleId` で1台の車両にスコープしますが、ダッシュボードは登録済みの全車両を一度に表示するため、車両IDを先に知らなくても「自分の記録を全部」取得できる入口が必要でした。それがこのファイルです。

## 構成

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `ListAllRecordsDeps` | interface | ハンドラが必要とする Supabase クライアントの最小インターフェース |
| `listAllRecordsHandler` | async function（export） | ログイン中ユーザーの整備記録を全件取得する純粋なハンドラ |
| `listAllRecordsFn` | const（export） | `createServerFn` でラップした実HTTPエンドポイント |

## コード解説

```ts
export async function listAllRecordsHandler(deps: ListAllRecordsDeps): Promise<MaintenanceRecordRow[]> {
  const { data, error } = await deps.supabase.from('maintenance_records').select('*')
  if (error) {
    throw new Error(error.message)
  }
  return data
}
```

`vehicleId` による `.eq()` 絞り込みが無いのが `list.ts` との唯一の違いです。`user_id` での絞り込みも書きません — これは `vehicles/server/list.ts` と同じ理由で、 `maintenance_records_select_own` ポリシー（RLS）が既に `auth.uid() = user_id` を強制しているため、アプリコード側で二重に絞り込むとポリシーが正しく機能しているかを隠してしまいます。

並び順を指定していないのも意図的です。呼び出し側（ダッシュボードのコンポーネント）は車両ごとに集計してから `dashboard/lib/since-last-service.ts` で最新日を求めるため、この時点での順序に意味がありません。

---

*生成日: 2026-09-19 ／ 対象ファイル: src/features/maintenance/server/list-all.ts*
