# アーキテクチャ解説

*Cloudflare Workers と Supabase がどう繋がり、どうデータベースへ届くか*

このページは「アプリが動いている仕組み」をファイル単位ではなく**流れ**で説明します。個々のファイルの解説は [プロジェクト解説（目次）](README.md) から辿れます。

- [全体構成](#全体構成--2つのクラウドが-https-だけで繋がっている)
- [デプロイされる物](#デプロイされる物の中身)
- [DBアクセスの経路](#データベースへのアクセス経路)
- [安全性の境界](#安全性の境界は-rls-であってアプリのコードではない)
- [認証とCookie](#認証と-cookie--2つの-supabase-クライアント)
- [招待フロー](#招待フローの全体像)
- [トランザクション](#車検完了だけ-rpc-を使っている理由)
- [Workers固有の制約](#cloudflare-workers-固有の制約への対応)

## 全体構成 — 2つのクラウドが HTTPS だけで繋がっている

```text
   ブラウザ (iPhone / PC)
        │  ① HTTPS
        ▼
 ┌──────────────────────────────┐        ┌──────────────────────────┐
 │  Cloudflare Workers          │   ③    │  Supabase                │
 │  vehicle-maintenance         │───────▶│  ・Auth (JWT 発行)        │
 │  ・SSR (HTML を組み立てる)    │  HTTPS │  ・PostgREST (REST API)  │
 │  ・サーバー関数 (実 API の入口)│◀───────│  ・PostgreSQL + RLS      │
 │  ・静的アセット配信           │        └──────────────────────────┘
 └──────────────────────────────┘
```

重要なのは **③ が特別な接続ではない**ことです。専用線も VPC ピアリングもなく、 Worker が公開インターネット経由で `https://<プロジェクト>.supabase.co` へ **普通の HTTPS リクエストを投げているだけ**です。Supabase 側から見れば「どこかのサーバーから来た API 呼び出し」であり、Cloudflare だから特別扱い、ということは一切ありません。

Postgres へのコネクションプールも張っていません。Workers には常時接続を維持する仕組みが無いため、この「REST 経由で DB を触る」構成が選ばれています。

## デプロイされる物の中身

`npm run deploy`（`vite build` → `wrangler deploy`）で本番に上がるのは2種類です。 `vite.config.ts` の `@cloudflare/vite-plugin` が生成します。

| 成果物 | 中身 | 配信のされ方 |
| --- | --- | --- |
| `dist/server/index.js` | Worker 本体。SSR とサーバー関数が入っている | リクエストのたびに実行される |
| `dist/client/` | JS・CSS・アイコンなどの静的ファイル | Workers Assets として、**Worker のコードを起動せずに**返される |

静的配信の設定はリポジトリの `wrangler.jsonc` には書かれていません。ビルド時に `dist/server/wrangler.json` が生成され、その中に `"assets": { "directory": "../client" }` が入ります。手書きの `wrangler.jsonc` に書いてあるのは、名前・互換性日付・ `nodejs_compat` フラグ・エントリポイントだけです。

## データベースへのアクセス経路

`.from('vehicles')` は「DB に直接つなぐ」のではなく、 **PostgREST への HTTPS リクエストに変換される**のが肝です。車両一覧 `/vehicles` を開いたときの実際の流れ:

```text
① ブラウザ  →  Worker            GET /vehicles          (Cookie 添付)
② _authed.tsx の beforeLoad で getSessionFn() → ログイン判定
③ ルートの loader が listVehiclesFn() を呼ぶ
④ Worker  →  Supabase PostgREST
     GET https://<proj>.supabase.co/rest/v1/vehicles?select=*&order=created_at
     apikey:        <publishable key>
     Authorization: Bearer <ユーザーの JWT>
⑤ Postgres が RLS を適用して「その人の行だけ」返す
⑥ Worker が HTML を組み立ててブラウザへ返す
```

該当コードは [`features/vehicles/server/list.ts`](src/features/vehicles/server/list.md) です。ここで目を引くのは **`user_id` で絞り込んでいない**ことで、これは意図的です。絞り込みは RLS が DB 側で強制するため、アプリ側にも書くと「ポリシーが本当に効いているか」をアプリのフィルタが隠してしまうからです。

> **サーバー関数は「関数」ではなく実 HTTP エンドポイント**
>
> ②③ の `getSessionFn` / `listVehiclesFn` は `createServerFn` で作られており、見た目は関数呼び出しですが実体は HTTP エンドポイントです。クライアントの JS を書き換えて直接叩けるため、フォーム側の検証は信用できません。だから **全書き込みはサーバー関数の入口で Zod 検証する**というルールになっています。

## 安全性の境界は RLS であって、アプリのコードではない

```sql
alter table public.vehicles enable row level security;
revoke all on public.vehicles from anon;
grant select, insert, update, delete on public.vehicles to authenticated;

create policy "vehicles_update_own" on public.vehicles for update to authenticated
  using       ((select auth.uid()) = user_id)
  with check  ((select auth.uid()) = user_id);
```

`auth.uid()` は、リクエストに添えられた **JWT の中身から Postgres が取り出す値**です。つまり「誰であるか」の判定は最終的に DB の中で行われます。

この設計の帰結:

- `VITE_SUPABASE_PUBLISHABLE_KEY` がブラウザの JS に埋め込まれて **公開されていても問題ない**。この鍵は「どのプロジェクトか」を示すだけで、権限は JWT 側が決める
- `service_role`（RLS を無視できる万能鍵）はアプリ側のどこにも存在しない。使うのはローカル実行の招待スクリプトだけ
- [`require-user.ts`](src/features/auth/require-user.md) のガードは **あくまで UX のため**。迂回して直接リクエストされても RLS が他人のデータを返さない

> **using と with check の両方が必要な理由**
>
> `using` だけだと、自分の行の `user_id` を他人の ID に書き換えて **行ごと他人に譲渡できてしまいます**。RLS で最も多いミスなので、 UPDATE ポリシーには必ず両方を書きます。

## 認証と Cookie — 2つの Supabase クライアント

|  | ブラウザ用 | サーバー用 |
| --- | --- | --- |
| ファイル | [`integrations/supabase/client.ts`](src/integrations/supabase/client.md) | [`integrations/supabase/server.ts`](src/integrations/supabase/server.md) |
| 生成 | シングルトン（使い回す） | **毎回作り直す** |
| 出番 | 招待リンクからのパスワード設定のみ | 通常の全データ操作 |

> **サーバー用をメモ化してはいけない**
>
> Cloudflare Workers は isolate を複数リクエストで再利用します。サーバー用クライアントをモジュールスコープにキャッシュすると、**前のリクエストの人のセッションを次の人が引き継ぎます**。ローカル開発でもテスター1人でも絶対に再現しない種類のバグです。

ログイン処理（[`auth/server/login.ts`](src/features/auth/server/login.md)）は `signInWithPassword()` を呼ぶだけで、Cookie を一切触っていません。 `createServerClient` に渡した `cookies.setAll` を Supabase 側が呼ぶため、 Cookie の書き込みは自動です。ログアウト時の削除も同じ仕組みです。

セッション確認に `getSession()` ではなく `getClaims()` を使うのも意図的です。前者は Cookie の値をそのまま信じますが、後者は JWT の署名を検証します（非対称鍵なら WebCrypto でローカル検証＝ネットワーク往復ゼロ）。

## 招待フローの全体像

このアプリに**一般公開のサインアップ画面はありません**。利用者はオーナーが 1人ずつ招待します。招待はブラウザからではなく、オーナーの PC で実行するローカル専用スクリプトで行います。

```text
┌── オーナーの PC ─────────────────────────────┐
│ node scripts/invite-user.ts <メール> <遷移先URL> │
│   ・scripts/.env の SUPABASE_SECRET_KEY を読む   │
│   ・admin.inviteUserByEmail(email, {redirectTo}) │
└───────────────────┬─────────────────────────┘
                    │ ① HTTPS (secret key)
                    ▼
            ┌──────────────────┐
            │ Supabase Auth    │  ② auth.users に未確定ユーザーを作成
            │                  │  ③ 招待メールを送信
            └────────┬─────────┘
                     │ ④ 利用者がメールのリンクを踏む
                     ▼
   https://.../set-password#access_token=...&refresh_token=...&type=invite
                     │
                     │ ⑤ ハッシュ(#以降)はサーバーに送られない
                     ▼
            ┌──────────────────────────────┐
            │ ブラウザ (set-password ページ) │
            │  ⑥ parseAuthHash でトークン抽出 │
            │  ⑦ history.replaceState で URL から消す │
            │  ⑧ setSession() でセッション確立 │
            │  ⑨ updateUser({password}) で設定 │
            └───────────┬──────────────────┘
                        │ ⑩ navigate('/')
                        ▼
                  ダッシュボード（ログイン済み）
```

### ① オーナー側 — 招待スクリプト

`scripts/invite-user.ts` は **このプロジェクトで唯一 secret key を使う場所**で、オーナーの PC 以外では動きません（`scripts/.env` は `.gitignore` 対象）。デプロイされる Worker にはこの鍵は含まれません。

スクリプトは実行時に招待先が「開発用」か「本番」かを URL から判定して表示します。第2引数で渡す遷移先 URL は、Supabase ダッシュボードの **Authentication → URL Configuration → Redirect URLs に登録されていないと機能しません** （登録外の URL はリンクの遷移先として拒否されます）。

### ④⑤ なぜトークンが `#` の後ろに付くのか

招待・パスワード再設定のリンクは **implicit フロー形式**で戻ってきます。つまりトークンが URL のハッシュフラグメントに載ります。

ハッシュは仕様上**ブラウザからサーバーへ送信されません**。この性質が、設計上2つの重要な帰結を生んでいます。

- **サーバー関数を経由できない** — Worker にはトークンが届かないので、セッション確立はブラウザ側でやるしかない。ここだけブラウザ用クライアントを使う理由がこれ
- **`set-password` は `_authed` 配下に置けない** — サーバー側のガードが「未ログイン」と判定して `/login` へ飛ばしてしまうため、認証不要のルートとして独立させている

### ⑥ なぜ手動でハッシュを解析するのか

Supabase SDK には `detectSessionInUrl` という自動検出の仕組みがありますが、 **この構成では効きません**。`@supabase/ssr` の `createBrowserClient` は flowType を `pkce` に固定しており、 implicit 形式のハッシュを「PKCE の URL ではない」として拒否するためです。

そこで [`auth/lib/parse-auth-hash.ts`](src/features/auth/lib/parse-auth-hash.md) がハッシュを自前で解析し、結果を3つの状態に分類します。この関数はブラウザ API も SDK も呼ばない純粋関数なので、単体テストで全分岐を検証できます。

| 判定結果 | 意味 | 画面の挙動 |
| --- | --- | --- |
| `tokens` | access/refresh トークンが揃っている | `setSession()` を実行しフォームを表示 |
| `error` | `error_code` が付いて戻ってきた | 日本語のエラー文言を表示 |
| `none` | ハッシュにトークンが無い | 既存セッションを確認し、無ければ案内を表示 |

### ⑦ トークンをすぐ URL から消す

```ts
if (parsed.kind !== 'none') {
  // トークンを URL に残さない（履歴・画面共有・Referer からの漏洩を防ぐ）
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
```

解析した直後にアドレスバーから消します。ブラウザ履歴に残る、スクリーンショットや画面共有に写り込む、といった経路でトークンが漏れるのを防ぐためです。

### ⑧⑨ セッション確立とパスワード設定

`setSession()` が成功すると Cookie にセッションが書かれます。ここで **Cookie を `httpOnly` にしていない設計**が効いてきます。ブラウザ側の JS で確立したセッションが、そのままサーバー関数からも読めるためです（代わりに `secure` を明示して平文 HTTP での送信を防いでいます）。

なお `setSession()` は、期限切れトークンのリフレッシュに失敗したとき **`error` が無いまま `session` だけ `null` になる**ことがあります。そのため戻り値の `session` の有無まで確認し、「リンクが期限切れです」と案内するようにしています。

パスワードは8文字以上・確認欄との一致をチェックしたうえで `updateUser({ password })` で設定し、成功したらダッシュボードへ遷移します。この時点で既にログイン済みなので、改めてログイン画面を通す必要はありません。

### 開発時の落とし穴 — StrictMode の二重実行

```ts
// 開発時の StrictMode は effect を2回実行する。1回目がハッシュを消すため、
// 2回目は「リンク経由ではない」と誤判定してしまう。実行自体を1回に絞る。
const startedRef = useRef(false)
```

⑦ で URL からトークンを消すため、effect が2回走ると2回目には読むものが無くなります。 `useRef` のフラグで初回だけ実行するようにして回避しています。

### エラー文言の出し分け方

[`auth/lib/auth-errors.ts`](src/features/auth/lib/auth-errors.md) が Supabase のエラーコードを日本語に変換します。ここで `invalid_credentials` と `user_not_found` を **あえて同じ文言**にしているのは、「そのメールアドレスは登録されていません」と出し分けると第三者が**招待済みのメールアドレスを詮索できてしまう**ためです（ユーザー列挙対策）。

### パスワード再設定も同じ道を通る

パスワードを忘れた場合の再設定メールも、招待と同じ implicit 形式で `/set-password` に戻ってきます。そのため `set-password` ページは招待専用ではなく、**招待と再設定の両方の受け口**として作られています。

## 車検完了だけ RPC を使っている理由

PostgREST の1リクエストは**テーブルをまたげません**。車検完了は「整備記録の挿入」＋「車両の満了日更新」の2テーブル更新なので、2回に分けると「記録だけ増えて満了日が古いまま」という半端な状態が起こりえます。

そこで Postgres 側に `complete_shaken` 関数を置き、 [`shaken/server/complete-shaken.ts`](src/features/shaken/server/complete-shaken.md) から `.rpc()` で1トランザクションとして呼んでいます。この関数は `security invoker` なので、**中の SQL にも呼び出したユーザーの RLS がそのまま適用**されます（`security definer` だと RLS を素通りしてしまいます）。

## Cloudflare Workers 固有の制約への対応

| 制約 | 何が起きるか | 対応 |
| --- | --- | --- |
| isolate の再利用 | モジュールスコープの状態が別リクエストへ漏れる | サーバー用 Supabase クライアントを毎回作り直す |
| 常に `TZ=UTC` | JST の利用者から見て日付が1日ずれる | `Date` に変換せず、`todayInJst()` と branded な `DateString`（`YYYY-MM-DD` 文字列）だけで計算する |
| `process.env` がモジュールスコープで空 | 起動時に環境変数を読むと undefined になる | `VITE_` 前置でビルド時にインライン化し、[`lib/supabase/env.ts`](src/lib/supabase/env.md) で Zod 検証してから使う |
| Node API が既定で使えない | Supabase SDK の一部が動かない | `wrangler.jsonc` で `nodejs_compat` を有効化 |

---

*生成日: 2026-09-20 ／ 関連: [プロジェクト解説（目次）](README.md)*
