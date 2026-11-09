# RLS 統合テスト基盤 — Phase 2: DB とマイグレーション

*vitest.rls.config.ts ／ supabase/tests/\*\**

## 概要

`supabase/migrations/*.sql` で作った RLS ポリシーが実際に機能しているかを、開発用 Supabase プロジェクトに直接接続して検証する統合テスト一式。 Docker を使わずローカルの Postgres を持たない方針のため、「本物のネットワーク越しに、本物の PostgREST 経由で」確認する構成になっている。

通常の単体テスト（`npm test`）とは目的も依存物も異なる（実ネットワーク・secret key が必要）ため、`vitest.rls.config.ts` という別設定に完全に分離し、`npm run test:rls` という別コマンドからのみ実行する。これにより、普段の開発ループで誤ってネットワークに繋ぎに行ったり、 secret key が無いことでテストが失敗したりすることを防いでいる。

## 構成

| ファイル | 役割 |
| --- | --- |
| `vitest.rls.config.ts` | RLSテスト専用のVitest設定（`npm test`には含まれない） |
| `supabase/tests/support/load-secret-env.ts` | テスト起動時に`scripts/.env`を読み込むセットアップファイル |
| `supabase/tests/support/env.ts` | 必要な環境変数の検証と、本番プロジェクト誤爆防止ガード |
| `supabase/tests/support/test-clients.ts` | 管理者クライアント／テストユーザー作成・削除のヘルパー |
| `supabase/tests/rls.test.ts` | 実際の検証シナリオ9件（Phase 8で4件追加） |

## コード解説

### 1. vitest.rls.config.ts — 専用のテスト設定

```ts
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    name: 'rls',
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    setupFiles: ['./supabase/tests/support/load-secret-env.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
```

メインの `vitest.config.ts`（unit/domプロジェクト）とは別ファイルにしている。理由は用途がまったく異なるため：このテストは実際にネットワーク接続してSupabaseの Admin APIでユーザーを作成・削除する。`include`を`supabase/tests/**` だけに絞り、通常の`src/**`のテストとは完全に混ざらないようにしている。

`setupFiles` でテスト実行前に `load-secret-env.ts` を読み込み、 `testTimeout`/`hookTimeout` を通常より長めの20秒にしている（実ネットワーク越しの複数リクエストを伴うため、デフォルトの5秒では不足しうる）。

### 2. load-secret-env.ts — secret key の読み込み

```ts
const scriptsEnvPath = resolve(process.cwd(), 'scripts/.env')

if (existsSync(scriptsEnvPath)) {
  process.loadEnvFile(scriptsEnvPath)
}
```

Vite の環境変数読み込みは `VITE_` 接頭辞の付いた変数だけを `import.meta.env` に載せる仕組みで、これは意図的な制限（secret をクライアントバンドルに紛れ込ませないため）。`SUPABASE_SECRET_KEY`はあえてこの仕組みの外に置きたいので、Node 標準の `process.loadEnvFile()`（Node 20.6+）で`scripts/.env`を直接読み、`process.env`に反映させている。

ファイルが無ければ何もしない（`existsSync`チェック）。これにより、CI等で`scripts/.env`が存在しない環境でも、このファイル自体はエラーにならず、後段の`env.ts`が分かりやすいエラーメッセージを出す設計にしている。

### 3. env.ts — 環境変数の検証と安全装置

```ts
function requireEnv(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `${name} が設定されていません。...`,
    )
  }
  return value
}

export const supabaseUrl = requireEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
export const publishableKey = requireEnv(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
export const secretKey = requireEnv('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY)
```

3つの環境変数を検証しつつ取り出す。`supabaseUrl`と`publishableKey` は`import.meta.env`（Viteの仕組み、`.env`から自動で入る）から、 `secretKey`は`process.env`（`load-secret-env.ts`が `scripts/.env`から手動で入れたもの）から読む、という取得経路の違いに注目。欠けていれば、どのファイルに何を設定すればいいかをそのままエラーメッセージにする。

```ts
const PRODUCTION_HOST = 'wwvuxjvcwntqzdvyezss.supabase.co'

if (supabaseUrl.includes(PRODUCTION_HOST)) {
  throw new Error(
    'RLS統合テストが本番用Supabaseプロジェクトを指しています。...',
  )
}
```

**安全装置**。このテストはテストユーザーの作成・削除を行うため、万が一 `.env` が本番用の値を指していた場合、本番環境に対して無関係なユーザーアカウントを作って消す、という事故になりかねない。本番プロジェクトのホスト名をコードに直接書いておき、それが含まれていたらテストの実行自体を即座に止める、という最後の砦を用意している。

### 4. test-clients.ts — クライアント生成とテストユーザーの入れ替わり

```ts
export function createAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, secretKey, NO_SESSION_PERSISTENCE)
}

export function createAnonClient(): SupabaseClient {
  return createClient(supabaseUrl, publishableKey, NO_SESSION_PERSISTENCE)
}
```

`createAdminClient`はsecret key（管理者権限）を使う。テストユーザーの作成・削除にのみ使い、**RLSポリシー自体の検証には使わない** （secret keyはRLSを無視できるため、これでSELECTしても何の検証にもならない）。

`createAnonClient`はpublishable key（アプリが実際に使うのと同じ鍵）。セッションを持たない状態＝未ログイン(anon)の挙動を確認するのに使う一方、ログイン後はセッション付きの「本物のユーザークライアント」としても使い回す（下記`provisionTestUser`参照）。

```ts
export async function provisionTestUser(admin: SupabaseClient, label: string): Promise<TestUser> {
  const email = `rls-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = crypto.randomUUID()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`テストユーザー(${label})の作成に失敗しました: ${error.message}`)
  }

  const client = createAnonClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  ...
  return { id: data.user.id, client }
}
```

このアプリは公開サインアップを無効化しているため、通常のサインアップ画面と同じ経路ではテストユーザーを作れない。そこで **Admin API（`admin.createUser`）で直接作成**し、 `email_confirm: true`でメール確認も済ませてしまう。その後、publishable keyの通常クライアントで`signInWithPassword`することで、RLSがそのまま効く「本物のログイン済みクライアント」を得ている。

メールアドレスは`Date.now()`とランダム文字列で毎回ユニークにしている。これはローカルDockerのようにDBを毎回リセットできる環境ではなく、永続的な開発用プロジェクトに対してテストを走らせるため、前回の実行が残したユーザーと衝突しないようにする工夫。

`if (error)`だけで`data.user`の存在チェックを省いているのは手抜きではなく、`UserResponse`の型が「`error`が`null` なら`data.user`は必ず存在する」という判別共用体になっているため、 TypeScriptがそのまま安全に絞り込んでくれる。

```ts
export async function deleteTestUser(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId)
  ...
}
```

テストユーザーを削除するだけで、その人が作った`vehicles`・ `maintenance_records`も一緒に消える。マイグレーションで `user_id references auth.users(id) on delete cascade`としているため、後片付け用の掃除コードを別に書く必要がない。

### 5. rls.test.ts — 検証シナリオ本体

```ts
describe('RLS: vehicles / maintenance_records', () => {
  const admin: SupabaseClient = createAdminClient()
  let userA: TestUser
  let userB: TestUser

  beforeAll(async () => {
    userA = await provisionTestUser(admin, 'a')
    userB = await provisionTestUser(admin, 'b')
  })

  afterAll(async () => {
    await deleteTestUser(admin, userA.id)
    await deleteTestUser(admin, userB.id)
  })
```

テストスイート全体で使い回す「持ち主A」「持ち主B」を1回だけ作り（`beforeAll`）、全テスト終了後に1回だけ消す（`afterAll`）。各テストごとに作り直さないのは、Admin API呼び出しは比較的遅く、 5つのテストごとに2ユーザー×5回作り直すと無駄に時間がかかるため。

```ts
it('自分の車両は取得でき、他人からは空で返る', async () => {
  const { data: vehicle } = await userA.client
    .from('vehicles').insert({ name: 'Aの車', vehicle_type: 'car' }).select().single()

  const { data: ownView } = await userA.client.from('vehicles').select().eq('id', vehicle!.id)
  expect(ownView).toHaveLength(1)

  const { data: otherView, error: otherError } = await userB.client
    .from('vehicles').select().eq('id', vehicle!.id)
  expect(otherError).toBeNull()
  expect(otherView).toHaveLength(0)
})
```

Bが「権限エラー」ではなく「0件」を受け取る点がポイント。RLSのSELECTポリシーはアクセス自体を拒否するのではなく、対象行を結果セットから静かに除外する。そのため`otherError`は`null`のまま、`otherView` が空配列になる、という形で検証している。

```ts
it('自分の車両のuser_idを他人に書き換えて譲渡できない(WITH CHECK)', async () => {
  const { data: vehicle } = await userA.client
    .from('vehicles').insert({ name: 'Aの車(譲渡テスト用)', vehicle_type: 'car' }).select().single()

  const { data: updated, error } = await userA.client
    .from('vehicles').update({ user_id: userB.id }).eq('id', vehicle!.id).select()

  expect(error).not.toBeNull()
  expect(updated).toBeNull()
})
```

更新対象の行を見つける段階（`using`）は自分の行なので通過するが、更新後の内容（`user_id = B`）が`with check`の条件（`auth.uid() = user_id`）を満たさなくなるため、PostgreSQLがこの時点でUPDATE文全体をエラーとして拒否する。「0件更新」ではなく「エラーになる」という違いが、前のSELECTのテストとの対比になっている。

```ts
it('他人のvehicle_idを使って自分名義の記録を挿入できない(複合FK)', async () => {
  const { data: bVehicle } = await userB.client
    .from('vehicles').insert({ name: 'Bの車', vehicle_type: 'car' }).select().single()

  const { data: record, error } = await userA.client.from('maintenance_records').insert({
    vehicle_id: bVehicle!.id,
    performed_on: '2026-01-01',
    work_type: 'engine_oil',
  })

  expect(error).not.toBeNull()
  expect(record).toBeNull()
})
```

この挿入は`user_id`を明示していないので`default auth.uid()` によりAのIDが入り、RLSのINSERTポリシー（`auth.uid() = user_id`）自体は通ってしまう。それでも失敗するのは、マイグレーションで張った `foreign key (vehicle_id, user_id) references vehicles (id, user_id)` という複合外部キーが、「Bの車両ID」と「Aのuser\_id」という存在しない組み合わせを拒否するため。RLSだけでは防げない穴を、この制約が埋めていることを直接確認している。

**Phase 8のDBレビューで、実装は正しいが回帰テストが無い箇所（テストギャップ）が4件指摘され、追加した。** いずれも「実装済みの防御が本当に効いているか」を確認するテストで、アプリのコード自体は変更していない（`complete_shaken`の所有権チェック順序修正は例外 — 別途 `supabase/migrations/ 20260919220000_fix_complete_shaken_ownership_check.sql` 参照）。

```ts
it('自分の整備記録のvehicle_idを他人の車両IDに書き換えられない(複合FK・UPDATE経由)', async () => {
  ...
  const { data: updated, error } = await userA.client
    .from('maintenance_records')
    .update({ vehicle_id: bVehicle!.id })
    .eq('id', record!.id)
    .select()

  expect(error).not.toBeNull()
  expect(updated).toBeNull()
})
```

既存の複合FKテストはINSERT経路のみを確認していたが、同じ複合外部キーは UPDATE文でも効くはずである。`vehicle_id`を他人の車両IDへ書き換えるUPDATEも同様に拒否されることを確認する。

```ts
it('自分の整備記録のuser_idを他人に書き換えて譲渡できない(WITH CHECK)', async () => {
  ...
  const { data: updated, error } = await userA.client
    .from('maintenance_records')
    .update({ user_id: userB.id })
    .eq('id', record!.id)
    .select()

  expect(error).not.toBeNull()
  expect(updated).toBeNull()
})
```

`vehicles_update_own`のWITH CHECKは既にテストされていたが、 `maintenance_records_update_own`の方は未検証だった。同じ譲渡攻撃パターンを`maintenance_records`側にも揃えた。

```ts
it('complete_shaken: 自分の車両なら整備記録の追加と満了日更新が1回のRPCで両方反映される', async () => {
  ...
  const { data: result, error } = await userA.client.rpc('complete_shaken', {
    p_vehicle_id: vehicle!.id,
    p_performed_on: '2026-01-01',
    p_new_expiry_date: '2028-01-01',
    p_odometer_km: 12345,
  })

  expect(error).toBeNull()
  expect(result?.work_type).toBe('shaken')
  ...
})

it('complete_shaken: 他人の車両IDを渡すと拒否され、記録も満了日もどちらも変化しない', async () => {
  ...
  const { data: result, error } = await userA.client.rpc('complete_shaken', {
    p_vehicle_id: bVehicle!.id,
    ...
  })

  expect(error).not.toBeNull()
  expect(result).toBeNull()
})
```

`complete_shaken` RPC自体を呼ぶテストがそれまで一切無かった。正常系（自分の車両で記録追加と満了日更新が両方反映される）と異常系（他人の車両IDを渡すと拒否され、どちらのテーブルも変化しない）の両方を追加し、「1トランザクションで両方成功するか、どちらも変化しないか」という`complete_shaken`の存在理由そのものを直接検証している。

```ts
it('未ログイン(anon)は両テーブルとも拒否される', async () => {
  const anon = createAnonClient()
  const { data, error } = await anon.from('vehicles').select()
  expect(error).not.toBeNull()
  expect(data).toBeNull()
  ...
})
```

セッションを持たない状態の`createAnonClient()`を使い、マイグレーションの`revoke all on ... from anon`が効いていることを確認する。こちらは「0件」ではなく「エラー」になる。テーブルへのアクセス権限自体が anonロールに無い（RLSの行フィルタ以前の話）ため、PostgreSQLが権限エラーを返す。

```ts
it('車両を削除すると整備記録もカスケード削除される', async () => {
  const { data: vehicle } = await userA.client
    .from('vehicles').insert({ name: 'Aの車(削除テスト用)', vehicle_type: 'car' }).select().single()

  await userA.client.from('maintenance_records').insert({
    vehicle_id: vehicle!.id, performed_on: '2026-01-01', work_type: 'tire',
  })

  await userA.client.from('vehicles').delete().eq('id', vehicle!.id)

  const { data: remaining } = await userA.client
    .from('maintenance_records').select().eq('vehicle_id', vehicle!.id)
  expect(remaining).toHaveLength(0)
})
```

車両を1件作り、それに紐づく整備記録を1件作ってから、車両だけを削除する。 `maintenance_records`側の `foreign key (vehicle_id, user_id) references vehicles (id, user_id) on delete cascade` により、親の車両が消えると子の整備記録も自動で消えることを確認している。

---

*生成日: 2026-09-19（Phase 8でテストケース4件を追記） ／ 対象ファイル: vitest.rls.config.ts, supabase/tests/support/load-secret-env.ts, supabase/tests/support/env.ts, supabase/tests/support/test-clients.ts, supabase/tests/rls.test.ts*
