# 進捗記録 — vehicle-maintenance

> **セッション開始時、まずこのファイルを読むこと。**
> 実装プラン全文: `C:\Users\barub\.claude\plans\tanstack-star-goofy-quill.md`

最終更新: 2026-09-20(スマホ幅のナビ／ログアウトボタン崩れを修正。`519f721` コミット＋本番デプロイまで完了)

---

## 現在地

**Phase 1〜9 全て完了。実装プランに定義された全フェーズが完了した。**

### Phase 9（docsの全体解説ページ）

- [x] **`docs/index.html`をプロジェクト全体解説ページへ拡張** — セッション開始時点で既に
      「ドキュメント目次」（各ファイル解説ページへのリンク集のみ）として存在していた
      同ファイルに、CLAUDE.mdルール4が要求する内容（アプリの概要／主な機能／使用技術・
      ツール・ライブラリ／フォルダ構成／設計上の要点）を追加するセクションを冒頭に挿入し、
      既存のファイル別リンク集は「ファイル別解説」節として維持した。新規ページを別途
      作らず1ページに統合した理由: 既存の目次ページがどこからもリンクされておらず、
      自然な入口として使えたため
      - 使用技術は`package.json`から実際の依存関係を確認して記載（`date-fns`は
        表示整形専用で計算には未使用、という既存の判断記録と整合させた）
      - フォルダ構成は`src`配下を実際に`find`して確認してから記載
      - **既存のファイル別リンク集に2件の抜け漏れを発見して修正**——
        `docs/src/lib/url/safe-redirect.html`（Phase 8で作成済みだが目次に未掲載）と
        `docs/e2e.html`（Phase 8で作成済みだが目次に未掲載）。全74リンクをNode.jsの
        `fs.existsSync`でファイル存在チェックし、リンク切れゼロを確認した
      - ブラウザ（Browser pane）でレンダリングも確認済み
Phase 8: 3エージェント並列レビュー→指摘のHIGH+Medium全修正→Playwright E2E(8シナリオ×2プロジェクト
=26テスト全成功)→`complete_shaken`修正マイグレーションを開発用・本番用の両方に適用確認済み→
`wrangler login`確認→`npm run deploy`で本番デプロイ完了→未ログインアクセスでログイン画面が
正しく表示されることを確認（コンソールエラーなし）。実際のアカウントでのフルログイン確認は
依頼者に委ねた（使い捨てテストユーザーを本番で作りたくないため）。
`src/lib/date/*`（5ファイル）、`src/features/shaken/lib/*`（4ファイル）、
`src/features/vehicles/lib/*`（3ファイル）、`src/features/maintenance/lib/*`（6ファイル）、
`src/features/dashboard/lib/*`（2ファイル）、`src/features/auth/lib/*`（2ファイル）が
すべて TDD で完成し、**205 テスト・カバレッジ全指標 100%**。
**マイグレーション4本(vehicles/maintenance_records/RLS/complete_shaken)を開発用・本番用
両方のSupabaseプロジェクトへ適用済み。RLS統合テストも5件全て成功。`database.types.ts`も
生成済み。** 専用サブエージェント作成は優先度を下げた（下記「判断の記録」参照）。

---

## 完了したこと

- [x] 要件ヒアリング完了（下記「確定仕様」参照）
- [x] スタック妥当性の検証 → TanStack Start / Supabase / Cloudflare Workers で採用可と判断
- [x] 実装プラン作成・承認取得
- [x] `CLAUDE.md` に作業ルールを記載
- [x] `.claude/agent-memory/progress.md`（このファイル）作成
- [x] `docs/setup-supabase.md` 作成し依頼者へ送付
- [x] **スキャフォールド完了** — `npx @tanstack/cli@latest create --framework React --blank --no-examples
      --deployment cloudflare --toolchain eslint --package-manager npm --no-git --no-intent --no-install -y`
      を scratchpad で実行 → 衝突ゼロを確認してプロジェクトへコピー
- [x] identity 修正 — `wrangler.jsonc` の name を `vehicle-maintenance` に、compatibility_date を 2026-09-05 に、
      `__root.tsx` を `lang="ja"` ＋タイトル「車両メンテナンス記録」に、`.gitignore` に `.dev.vars` `scripts/.env`
      とテスト成果物を追加
- [x] **依存パッケージのインストール完了**（脆弱性 0 件）
      本番: `@supabase/supabase-js` `@supabase/ssr` `zod` `date-fns`
      開発: `vitest` `@vitest/coverage-v8` `@testing-library/{react,user-event,jest-dom}` `jsdom`
            `@playwright/test` `supabase`
- [x] **開発 DB 方針の決定** — Docker は入れず、**Supabase プロジェクトを 2 つ**（dev / 本番）作る方針。
      `docs/setup-supabase.md` を 2 プロジェクト構成に更新して依頼者へ送付済み
- [x] **雛形の健全性を確認** — `npm run build` ✅ / `npx tsc --noEmit` ✅ / `npm run lint` ✅
      `src/routeTree.gen.ts` が自動生成されることも確認
- [x] **承認粒度の合意** — 検証系コマンド（lint / typecheck / test / build / dev）は**事前承認済み**で
      毎回止まらない。①インストール ②デプロイ ③本番DBへの適用 ④大容量DL ⑤削除 は**都度承認**
- [x] **テスト基盤の構築** — `vitest.config.ts`（unit / dom の 2 プロジェクト）と `src/test/setup.ts`
      Vitest 5 の型定義を直接読んで `projects` と glob 単位 `thresholds` が使えることを確認済み
- [x] **package.json にスクリプト追加** — `typecheck` / `test` / `test:watch` / `test:coverage`
- [x] **ESLint に lib 境界ルールを追加** — `src/**/lib/**/*.ts` から React / @tanstack/* / @supabase/* を
      import 禁止（日本語のエラーメッセージ付き）
- [x] **`src/lib/date/date-string.ts` 完成**（TDD: RED → GREEN 確認済み）
      `DateString` ブランド型 / `isDateString` / `toDateString` / `toUtcMillis` / `daysBetween` /
      `isOnOrAfter` / `isOnOrBefore`。34 テスト・カバレッジ 100%
- [x] **解説ドキュメント生成** — `docs/src/lib/date/date-string.html`（共有CSS `docs/assets/doc-style.css` も初回作成）
- [x] **Git 初回コミット完了**（コミット `6fd85c4`）。機密情報の混入なしを確認済み
- [x] **`src/lib/date/jst.ts` 完成** — `todayInJst()`。`Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo'})`
      で実行環境のタイムゾーンに依存せず JST の「今日」を取得。`docs/.../jst.html` 生成済み
- [x] **`src/lib/date/add-months.ts` 完成** — `addMonths` / `addYears`。月末クランプ（1/31+1ヶ月→2/28等）に
      対応。20 テスト。`docs/.../add-months.html` 生成済み
- [x] **`src/lib/date/format-ja.ts` 完成** — `formatJa` / `formatJaShort`。**lib/date で唯一 date-fns を使う
      ファイル**（表示整形専用、計算には使わない）。6 テスト。`docs/.../format-ja.html` 生成済み
- [x] **`src/features/shaken/lib/days-remaining.ts` 完成** — `daysUntilExpiry`。満了日 null（250cc以下等）を
      正しく扱う。4 テスト
- [x] **`src/features/shaken/lib/alert-tier.ts` 完成** — `shakenAlertTier`（アプリの中核要件）。
      none/warning/danger/expired の4段階を暦月で判定。12 テスト
- [x] **`src/features/shaken/lib/renewal.ts` 完成** — `computeNextShakenExpiry`。**制度どおりの繰り越し
      ルール**（満了日1ヶ月前以内の受検は「旧満了日+N年」）を実装。10 テスト
- [x] **`src/features/shaken/lib/messages.ts` 完成** — `shakenTierMessage`。段階別の日本語メッセージ。6 テスト
- [x] **shaken/lib 4ファイルの解説ドキュメント生成完了** — `docs/src/features/shaken/lib/*.html`
- [x] **`src/features/vehicles/lib/vehicle-type.ts` 完成** — `VehicleType`（car/motorcycle）と
      日本語ラベル変換 `vehicleTypeLabel`。2テスト
- [x] **`src/features/vehicles/lib/shaken-required.ts` 完成** — `shakenRequired`。満了日
      （`shakenExpiryDate`）の有無だけで車検UI表示の要否を判定（車両区分では分岐しない）。2テスト
- [x] **`src/features/vehicles/lib/vehicle-schema.ts` 完成** — `vehicleSchema`（Zod）。
      name(trim+必須+50字)/vehicleType(enum)/shakenExpiryDate(null許容、`isDateString`共有検証)/
      note(trim+1000字+空文字デフォルト)。Zod 4の`.transform()`+`ctx.addIssue`+`z.NEVER`パターンと
      `z.enum(..., {error})`の記法をnode -eで実挙動確認してから実装。13テスト
- [x] **vehicles/lib 3ファイルの解説ドキュメント生成完了** — `docs/src/features/vehicles/lib/*.html`
- [x] **`src/lib/date/date-string-schema.ts` 完成** — `dateStringSchema`。`vehicle-schema.ts`
      に元々あったZod日付検証を共通化して抽出（`record-schema.ts` と共有するため）。
      `vehicle-schema.ts` はこれをimportする形にリファクタし、テスト・型・lintを再確認済み。4テスト
- [x] **`src/features/maintenance/lib/work-types.ts` 完成** — `WORK_TYPES`（7プリセット、`as const`）、
      `workTypeLabel`、`isOtherWorkType`。10テスト
- [x] **`src/features/maintenance/lib/record-schema.ts` 完成** — `recordSchema`（Zod）。
      performedOn(共有dateStringSchema)/workType(enum)/workTypeOther/odometerKm(int・0以上・null許容)/
      partDetail/note。**「その他」選択時はworkTypeOther必須**というルールを`.refine()`＋`path`で実装。13テスト
- [x] **`src/features/maintenance/lib/filter-records.ts` 完成** — `filterRecords`。vehicleId/workType/
      日付範囲(from・to)で絞り込む。ジェネリクスで最小限の構造型のみ要求。9テスト
- [x] **`src/features/maintenance/lib/sort-records.ts` 完成** — `sortRecords`（newest/oldest既定newest）。
      同日レコードの安定ソート(compareAscで0を返す分岐)もカバレッジ100%のためテスト追加。6テスト
- [x] **`src/features/maintenance/lib/part-suggestions.ts` 完成** — `partSuggestions`。過去の部品/型式を
      重複除去・登場順維持でサジェスト、queryで部分一致絞り込み。7テスト
- [x] **`src/features/maintenance/lib/odometer.ts` 完成** — `isOdometerRegression`。走行距離の逆行警告
      （同日以前の記録より少ない／同日以降の記録より多い、の両方向を判定）。8テスト
- [x] **maintenance/lib 6ファイル＋date-string-schema.tsの解説ドキュメント生成完了**
- [x] **`src/features/dashboard/lib/since-last-service.ts` 完成** — `sinceLastService`。実施日
      （`performedOn`）だけを持つ記録の配列から、最新の実施日と今日までの経過日数を求める。
      作業内容での絞り込みは行わず、必要なら呼び出し側で`filter-records.ts`を先にかける設計。4テスト
- [x] **`src/features/dashboard/lib/build-summary.ts` 完成** — `buildVehicleSummary` /
      `buildVehicleSummaries`。車両1台分（区分・車検満了日）と整備記録一覧から、
      `shakenAlertTier`（shaken/lib）・現在の走行距離(`odometerKm`の最大値から導出。
      `vehicles.current_odometer`列は持たない設計方針どおり)・`sinceLastService`をまとめた
      ダッシュボード用サマリーを組み立てる。6テスト
- [x] **dashboard/lib 2ファイルの解説ドキュメント生成完了** — `docs/src/features/dashboard/lib/*.html`
- [x] **`src/features/auth/lib/login-schema.ts` 完成** — `loginSchema`(Zod)。email(trim→必須→
      形式検証の順でチェーン。trimをemail検証より前に置くのが要点)/password(空文字のみ拒否、
      強度要件や trim は課さない=ログイン画面の責務ではないため)。6テスト
- [x] **`src/features/auth/lib/auth-errors.ts` 完成** — `authErrorMessage`。Supabase Auth の
      エラーコード(`@supabase/auth-js`の`error-codes.ts`をnode -eで確認して実在するコードのみ対応)を
      日本語メッセージへ変換。`invalid_credentials`と`user_not_found`を同一文言にしてユーザー列挙を防止。
      `@supabase/*`をimportしないよう構造的型`AuthErrorLike`で受け取る設計。13テスト
- [x] **auth/lib 2ファイルの解説ドキュメント生成完了** — `docs/src/features/auth/lib/*.html`
- [x] **Supabase プロジェクト作成完了（依頼者側）** — dev/本番の Project URL・Publishable key を受領し
      `.env`（dev）/ `.env.production.local`（本番）に保存。**Supabase ダッシュボードの表記が
      「Project URL」→「API URL」に変わり、場所も Project Settings → General から
      Project Settings → Data API に移動**していたため `docs/setup-supabase.md` の3-1を修正済み
- [x] **公開サインアップの無効化を dev/本番の両方で確認済み**
- [x] **マイグレーション4本を作成**
      — `supabase/migrations/20260907230000_create_set_updated_at_function.sql`
      （updated_at 自動更新トリガー関数）
      `supabase/migrations/20260907230100_create_vehicles.sql`
      （vehicles テーブル。RLS 4ポリシー・`unique(id,user_id)`）
      `supabase/migrations/20260907230200_create_maintenance_records.sql`
      （maintenance_records テーブル。`(vehicle_id,user_id)` 複合外部キー・RLS 4ポリシー・
      `work_type='other'`時の`work_type_other`必須CHECK制約）
      `supabase/migrations/20260907230300_create_complete_shaken_function.sql`
      （`complete_shaken` RPC。`security invoker`で記録追加＋満了日更新をアトミックに実行）
- [x] **開発用Supabaseプロジェクトへ適用完了** — SQL Editorに全文貼り付けで実行（依頼者側で実施）。
      Table Editorで`vehicles`・`maintenance_records`の作成を依頼者が確認済み。
      **CLIでの`supabase link`/`db push`は使わなかった**——DBパスワードや個人アクセストークンは
      Claudeが扱わない方針のため、SQL Editorへの手動貼り付けを選択(依頼者に2択を提示して選んでもらった)
- [x] **マイグレーション4本の解説ドキュメント生成完了** — `docs/supabase/migrations.html`
      （4ファイルをPhase 2の一連の内容として1ページにまとめた。個別ページには分けていない）
- [x] **RLS統合テスト一式が完成し、開発用プロジェクトに対して5件全て成功**
      — `supabase/tests/rls.test.ts`、`supabase/tests/support/{env,test-clients,load-secret-env}.ts`、
      `vitest.rls.config.ts`。`npm run test:rls`で実行（`npm test`には含めない）。
      `scripts/.env`の`SUPABASE_SECRET_KEY`(開発用)を使い、Admin APIで使い捨てテストユーザー
      2人を作成・削除する方式（公開サインアップが無効なため、通常のsignUpは使えない）。
      本番プロジェクトを誤って対象にしないよう、ホスト名比較のガードを`env.ts`に実装済み
- [x] **RLS統合テスト基盤の解説ドキュメント生成完了** — `docs/supabase/tests/rls.html`
- [x] **`src/lib/supabase/database.types.ts` 生成完了** — 開発用Supabaseダッシュボード（API Docs →
      TypeScript タブ）から依頼者が直接コピーして貼り付け。当初案内したCLI（`supabase gen types
      typescript`、個人アクセストークン必要）ではなく、**トークンを一切作らないダッシュボード経由の
      方法**に切り替えた（詳細は下記「判断の記録」参照）。型チェック(`tsc --noEmit`)エラー0件を確認済み。
      `routeTree.gen.ts`と同様の自動生成ファイルのため、解説ドキュメントは生成しない方針
- [x] **本番用Supabaseプロジェクトへのマイグレーション適用完了** — 開発用と同じSQL Editor手動貼り付け
      方式で①〜④(set_updated_at関数/vehicles/maintenance_records/complete_shaken関数)を実行。
      **適用前に本番プロジェクトが無料プランの自動一時停止状態だったため、依頼者が「Resume project」
      で再開してから実行**（データは無事だった）。`vehicles`・`maintenance_records`テーブルの
      作成を依頼者がTable Editorで確認済み。**Phase 2 完了**

### Phase 4（認証）

- [x] **`src/lib/supabase/env.ts` 完成** — `getSupabaseEnv()`。`VITE_SUPABASE_URL`/
      `VITE_SUPABASE_PUBLISHABLE_KEY` をZodで検証。3テスト
- [x] **`src/integrations/supabase/client.ts` 完成** — `getSupabaseBrowserClient()`。
      ブラウザ用シングルトン。2テスト
- [x] **`src/integrations/supabase/server.ts` 完成** — `createSupabaseServerClient()`。
      呼ぶたびに新しいクライアントを返す（モジュールスコープでメモ化しない）。
      TanStack Startの`getCookies`/`setCookie`とSupabaseの`getAll`/`setAll`を橋渡し。4テスト
- [x] **`src/features/auth/require-user.ts` 完成** — `requireUser()`。未ログインなら
      `/login`へのredirectを投げる純粋関数。2テスト
- [x] **`src/features/auth/server/{get-session,login,logout}.ts` 完成** — `createServerFn`で
      包んだサーバー関数3本。実処理は`deps`注入可能な`xxxHandler`として分離し、
      Supabaseクライアントをモックしてユニットテスト（DBアクセスなし）。計9テスト
- [x] **`src/routes/{_authed,_authed.index,login,set-password}.tsx` 完成** — 認証ガード
      レイアウト・ログイン後仮ページ・ログイン画面・パスワード設定画面
- [x] **`scripts/invite-user.ts` 完成** — オーナーがローカルで実行する招待スクリプト
      （`node scripts/invite-user.ts <email> [redirectTo]`）。Claudeは実行しない
      （`SUPABASE_SECRET_KEY`を扱わない方針のため）
- [x] **Phase 4全ファイルの解説ドキュメント生成完了** — `docs/src/lib/supabase/env.html`、
      `docs/src/integrations/supabase/{client,server}.html`、
      `docs/src/features/auth/require-user.html`、
      `docs/src/features/auth/server/{get-session,login,logout}.html`、
      `docs/src/routes/{_authed,_authed.index,login,set-password}.html`、
      `docs/scripts/invite-user.html`
- [x] **`vite dev`で実ログイン動作をブラウザ確認済み** — 開発用Supabaseに使い捨てテストユーザーを
      Admin APIで作成 → 未ログイン`/`アクセスで`/login`へリダイレクト確認 →
      正しいパスワードでログイン成功・仮ダッシュボード表示確認 → ログアウトで`/login`へ戻る確認 →
      誤ったパスワードで日本語エラーメッセージ表示確認。テストユーザーは確認後すぐ削除済み
- [x] **`npm run lint` / `tsc --noEmit` / `npm run test:coverage`（223テスト全通過） /
      `npm run build` 全て green** — Phase 4完了

### Phase 5（車両CRUD）

- [x] **`src/features/vehicles/lib/vehicle-id-schema.ts` 完成** — `vehicleIdSchema`。
      `id`がUUID形式かだけを検証する（存在確認・所有権確認はRLS/各ハンドラに委譲）。3テスト
- [x] **`src/features/vehicles/server/{list,get,create,update,delete}.ts` 完成** —
      このプロジェクトで初めてDBテーブル（`vehicles`）を直接操作するサーバー関数群。
      Phase 4のauth/serverと同じ「`xxxHandler`(deps注入・純粋)＋`xxxFn`(`createServerFn`
      ラッパー)」パターンを踏襲し、`deps.supabase`は`Pick<SupabaseClient<Database>, 'from'>`
      で narrow化。テストは`vi.fn()`の素のオブジェクトを渡すだけで型キャスト一切不要
      （`vi.fn()`の`any`推論により実クライアントの複雑なオーバーロード型とも自然に整合する
      ことを確認済み）。`list`/`get`は明示的な`user_id`絞り込みを書かない
      （RLSの`vehicles_select_own`等に委任、二重チェックでポリシーの機能を隠さない）。
      `get`/`update`は`.maybeSingle()`を使い「存在しない」と「他人の車両(RLSブロック)」を
      区別せず`null`を返す（情報漏洩防止）。`delete`は物理削除
      （`maintenance_records`側の`on delete cascade`で整備記録も連鎖削除される設計）。
      計13テスト
- [x] **`src/features/vehicles/vehicle-form.tsx` 完成** — 新規登録・編集で共用するフォーム。
      `<input type="date">`の空文字列を送信時に`null`へ変換してから`vehicleSchema`で検証
      （250cc以下のバイク等、車検満了日を持たない車両を自然に扱うための変換）。
      dom project（jsdom）でのコンポーネントテストはこのプロジェクトで初めて。5テスト
- [x] **ルート5本完成** — `_authed.vehicles.index.tsx`(一覧)/`.new.tsx`(新規登録)/
      `.$vehicleId.tsx`(レイアウト。`beforeLoad`で`getVehicleFn`を呼び`vehicle`を
      route contextに積む。`_authed.tsx`が`user`を積むのと同じパターン。見つからなければ
      `notFoundComponent`で日本語の専用画面を表示)/`.$vehicleId.index.tsx`(詳細・削除)/
      `.$vehicleId.edit.tsx`(編集)。`routes/**`はカバレッジ対象外（E2Eで検証する方針）
      のため単体テストは書いていない
- [x] **`_authed.index.tsx`(Phase4の仮ホーム)に「車両一覧へ」リンクを追加** —
      本実装はPhase 7で置き換わる前提は変わらないが、手動確認の導線として追加
- [x] **開発用Supabaseで使い捨てテストユーザーを作成しブラウザで実動作確認** —
      ログイン→一覧(空)→新規登録(車検満了日あり「ロードスター」)→詳細表示
      （日本語日付表示`2027年5月1日(土)`を確認）→編集→一覧反映→新規登録
      （車検満了日なし「カブ」→「車検対象外」表示を確認）→削除
      （`window.confirm`はブラウザ自動化では既定でキャンセルされるため
      `window.confirm = () => true`に一時的に上書きして確認）→一覧から消えたことを確認
      →存在しないIDへの直接アクセスで`notFoundComponent`表示を確認。
      テストユーザーは確認後すぐ削除済み（Phase 4と同じ使い捨て運用）
- [x] **Phase 5全ファイル(12ファイル)の解説ドキュメント生成完了** —
      `docs/src/features/vehicles/lib/vehicle-id-schema.html`、
      `docs/src/features/vehicles/server/{list,get,create,update,delete}.html`、
      `docs/src/features/vehicles/vehicle-form.html`、
      `docs/src/routes/_authed.vehicles.{index,new,$vehicleId,$vehicleId.index,$vehicleId.edit}.html`。
      あわせて`docs/src/routes/_authed.index.html`（Phase4作成分）もリンク追加を反映して更新
- [x] **`npm run lint` / `tsc --noEmit` / `npm run test:coverage`(243テスト全通過) /
      `npm run build` 全て green** — Phase 5完了

### Phase 6（整備記録CRUD）

- [x] **`src/features/maintenance/lib/vehicle-scope-schema.ts` 完成** — `vehicleScopeSchema`。
      `{ vehicleId: uuid }`。`list`/`list-part-details`の入口で使う。フィールド名を
      `vehicleId`にしているのは、`recordIdSchema`（記録自身の`id`）と合成したときに
      フィールド名が衝突しないため。2テスト
- [x] **`src/features/maintenance/lib/record-id-schema.ts` 完成** — `recordIdSchema`。
      `{ id: uuid }`。vehicles/lib/vehicle-id-schema.tsと同型だが対象リソースが
      異なることを明示するため独立ファイルにした。2テスト
- [x] **整備記録CRUDの入力スキーマ合成パターンを確立** — `recordSchema`（Phase 3、
      `.refine()`で作られたZodEffects）は`.shape`を持たないため、Phase 5の
      `vehicleIdSchema.extend(vehicleSchema.shape)`という手法が使えない。
      代わりに`vehicleScopeSchema.extend({ record: recordSchema })`
      （create）／`recordIdSchema.extend({ record: recordSchema })`（update）という
      **ネストしたフィールドとして合成**する方式を採用。`.extend()`はネストする
      フィールドの型を問わないため、この制約下でも動作する。実装前に`node -e`で
      Zod 4の実際の挙動（ネストしたrefineスキーマのエラーpathが`record.xxx`に
      正しくネストされること）を確認してから実装した
- [x] **`src/features/maintenance/server/{list,create,update,delete,list-part-details}.ts` 完成** —
      実装プランどおり5本。vehicles/serverと同じ`xxxHandler(deps注入)+xxxFn`パターン。
      `list`/`list-part-details`は`vehicleId`でスコープし`user_id`絞り込みは書かない
      （RLSの`maintenance_records_select_own`等に委任）。`update`は`vehicle_id`を
      更新対象に含めない（記録を別の車両へ付け替える操作は仕様に無い）。
      専用の「1件取得」関数（`get.ts`相当）は作っていない——実装プランの
      列挙どおり5本で、編集ルートは`listRecordsFn`+`.find()`で代替（下記参照）。計11テスト
- [x] **`src/features/maintenance/record-form.tsx` 完成** — 整備記録の登録・編集で
      共用するフォーム。vehicle-form.tsxと同じ設計（素のHTML+Zod、送信時に
      `recordSchema.safeParse()`）。作業内容「その他」選択で自由入力欄が出て、
      プリセットに戻すと値がクリアされる。走行距離逆行警告（`isOdometerRegression`）は
      `role="status"`（非ブロッキング）、入力検証エラーは`role="alert"`と役割を分けた。
      部品/型式は`<datalist>`標準機能でサジェスト。8テスト
- [x] **maintenance/lib新規2ファイル・server5ファイル・record-form.tsxの
      解説ドキュメント生成完了** — `docs/src/features/maintenance/lib/{vehicle-scope-schema,
      record-id-schema}.html`、`docs/src/features/maintenance/server/*.html`、
      `docs/src/features/maintenance/record-form.html`
- [x] **`_authed.vehicles.$vehicleId.index.tsx`を拡張** — 車両詳細ページに整備記録
      一覧を統合。`loader`で`listRecordsFn`を呼び、DB行を`toFilterable`で
      キャメルケースへ変換してからPhase 3の`filterRecords`/`sortRecords`
      （作業内容フィルタ・新しい順固定）にそのまま渡す設計。整備記録の削除は
      同じページに留まりたいため`useRouter().invalidate()`で`loader`を再実行
      （車両削除は`navigate`で一覧へ戻る、という既存の使い分けと対比）。
      解説ドキュメントも再生成済み
- [x] **`_authed.vehicles.$vehicleId.records.new.tsx`／`.records.$recordId.edit.tsx` 完成** —
      新規登録・編集ルート。どちらも`listRecordsFn`+`listPartDetailsFn`を
      `Promise.all`で並行取得し、`part-suggestions.ts`/`odometer.ts`（Phase 3）に
      橋渡しする。編集ルートは専用の「1件取得」サーバー関数を作らず、車両スコープの
      一覧から`.find()`で絞り込み、見つからなければ`_authed.vehicles.$vehicleId.tsx`と
      同じ`notFound()`パターンで統一。編集時の走行距離逆行チェックは
      編集対象の記録自身を比較対象から除外する。解説ドキュメント生成完了
- [x] **`npm run build`でrouteTree.gen.tsの再生成を確認** — 新規3ルート
      （records/new、records/$recordId/edit、拡張済み$vehicleId/index）が
      正しく登録された
- [x] **lintで2件のIssue修正** — ①`record-form.tsx`の`isDateString`型ガード後の
      不要な`as DateString`キャスト（`@typescript-eslint/no-unnecessary-type-assertion`）
      を削除。②一覧表示の区切り文字に全角スペース「　」を使っていたのが
      `no-irregular-whitespace`に抵触したため「・」に変更
- [x] **開発用Supabaseで使い捨てテストユーザーを作成しブラウザで実動作確認** —
      車両登録→整備記録2件登録（うち1件は「その他」＋走行距離逆行状態で登録できる
      ことを確認）→一覧が新しい順で表示→作業内容フィルタで絞り込み確認→
      編集画面で初期値反映・逆行警告（自分自身は除外して比較）を確認→走行距離を
      修正すると警告が消えることを確認→更新→削除（`router.invalidate()`で
      ページ遷移なしに一覧から消えることを確認）→削除済み記録のURL直叩きで
      404画面（整備記録が見つかりません）を確認→車両ごと削除。
      テストユーザーは確認後すぐ削除済み（Phase 4/5と同じ使い捨て運用、
      一時スクリプト`scripts/_verify-phase6-user.ts`もコミット前に削除済み）
- [x] **`npm run lint` / `tsc --noEmit` / `npm run test:coverage`(266テスト全通過) /
      `npm run build` 全て green** — Phase 6完了

### Phase 7（ダッシュボードと車検アラート）

- [x] **`src/features/shaken/lib/renewal.ts` に `SHAKEN_VALID_YEARS` 定数を追加** —
      `ShakenValidYears`（2|3）の全値を列挙する配列。車検完了フォームの
      「有効期間」セレクトの選択肢を作るために使う。`work-types.ts` の
      `WORK_TYPES`+`WorkType` と同じ「型の全値をUIに列挙する」パターン。1テスト追加
- [x] **`src/features/shaken/lib/complete-shaken-schema.ts` 完成** —
      `completeShakenSchema`（Zod）。受検日・新しい満了日・走行距離・部品/型式・備考を検証。
      `record-schema.ts` と似た制約（走行距離0以上整数・文字数上限・trim）だが
      `workType` を持たない別スキーマとして独立させた（車検完了は常に
      `work_type='shaken'`固定のため）。「新しい満了日」は受検日との前後関係を
      強制しない（手動修正を尊重するため）。10テスト
- [x] **`src/features/maintenance/server/list-all.ts` 完成** — `listAllRecordsFn`。
      ログイン中ユーザーの整備記録を車両を問わず全件取得する。ダッシュボードが
      車両横断で最終整備日・現在の走行距離を集計するために新設（既存の`list.ts`は
      1台の車両にスコープするため使えなかった）。2テスト
- [x] **`src/features/shaken/server/complete-shaken.ts` 完成** — `completeShakenFn`。
      Phase 2で作成済みのPostgres関数`complete_shaken`を`.rpc()`で呼び、
      「整備記録(work_type='shaken')の挿入」と「車両の満了日更新」を1トランザクションで
      実行する。`vehicleScopeSchema`（`maintenance/lib`）を機能をまたいで再利用
      （`dashboard/lib/build-summary.ts`が`shaken/lib`・`vehicles/lib`を横断
      importする既存の前例にならった）。`odometerKm`の`null`→`undefined`変換は
      RPCの引数型（`p_odometer_km?: number`、null不可）とアプリの規約（nullで
      「未記録」を表す）を橋渡しするため。2テスト
- [x] **`src/features/shaken/complete-shaken-form.tsx` 完成** — `ShakenForm`。
      受検日・有効期間・新しい満了日・走行距離・部品/型式・備考のフォーム。
      「新しい満了日」は`computeNextShakenExpiry`の自動計算値を表示しつつ
      手動修正もできる（`newExpiryDateOverride`が無ければ計算値、あれば
      そちらを優先する`??`の連鎖）。受検日・有効期間を変更すると手動修正を
      リセットする（`useEffect`を使わず、各`onChange`ハンドラ内で直接
      リセットする設計）。7テスト
- [x] **ルート3本完成** — `_authed.vehicles.$vehicleId.shaken.tsx`(新規。車検完了フォームの
      表示と送信)/`_authed.vehicles.$vehicleId.index.tsx`(拡張。`shakenRequired`で
      ガードした車検アラート表示＋「車検完了を記録」リンクを追加)/
      `_authed.index.tsx`(Phase4の仮ホームを本実装のダッシュボードへ置き換え。
      車両一覧・現在の走行距離・前回整備日・車検アラート＋ショートカットリンクを表示)
- [x] **Phase 7全ファイルの解説ドキュメント生成完了** —
      `docs/src/features/shaken/lib/{renewal(追記),complete-shaken-schema}.html`、
      `docs/src/features/maintenance/server/list-all.html`、
      `docs/src/features/shaken/server/complete-shaken.html`、
      `docs/src/features/shaken/complete-shaken-form.html`、
      `docs/src/routes/{_authed.index(全面改稿),_authed.vehicles.$vehicleId.shaken,
      _authed.vehicles.$vehicleId.index(追記)}.html`
- [x] **開発用Supabaseで使い捨てテストユーザーを作成しブラウザで実動作確認**
      （実行前にユーザーへ確認を取ってから実施）——
      車両登録（車検満了日を21日後に設定）→詳細・ダッシュボード両方で
      「車検まであと21日です。お早めに受検してください。」（danger段階）を確認→
      「車検完了を記録」→受検日入力で新しい満了日が制度どおり自動計算（繰り越し）
      されることを確認→走行距離入力→送信→満了日が更新され、整備記録に
      `work_type='shaken'`の記録が1件増えたことを確認（RPCの1トランザクション動作）→
      ダッシュボードで走行距離・前回整備日が反映されアラートが消えたことを確認→
      満了日なしの車両（バイク・カブ90）を登録し、詳細・ダッシュボードどちらにも
      車検UI・アラートが一切出ないことを確認（E2E要件どおり）。
      テストユーザー・車両・記録は確認後すぐ削除済み（`on delete cascade`で
      ユーザー削除により連鎖削除。一時スクリプト`scripts/_verify-phase7-user.ts`も
      コミット前に削除済み）
- [x] **開発サーバーのポート競合に対応** — 別セッションが`vehicle-maintenance-dev`
      （ポート3000）を使用中だったため、`.claude/launch.json`に
      `vehicle-maintenance-dev-alt`（ポート3101、`npx vite dev --port 3101`で
      `package.json`の`dev`スクリプトは変更しない）を追加してブラウザ確認に使用。
      `package.json`の`dev`スクリプト自体は招待メールのリダイレクトURL設定
      （ポート3000がSupabaseダッシュボードに登録されている想定）と結びついているため
      変更しなかった
- [x] **`npm run lint` / `tsc --noEmit` / `npm run test:coverage`(288テスト全通過) /
      `npm run build` 全て green** — Phase 7完了

### 2026-09-20（招待/再設定リンクからのパスワード設定の修正）

- [x] **`/set-password`が機能していなかった不具合を修正** — 依頼者が開発環境で初めて
      招待メール経由のログインを試したところ、ログイン画面に飛ばされる／
      「エラーが発生しました」になる、という形で発覚。原因は2つ重なっていた:
  - **原因1: Site URLの設定** — 開発用Supabase（`rldmmiyhlnasghubigua`）の
    Auth → URL Configuration の Site URL が `http://localhost:3000`（パスなし）だった。
    ダッシュボードから送る招待/再設定メールは redirect_to を指定できず Site URL に飛ぶため、
    `/`（`_authed`配下）に着地 → ハッシュはサーバーに送られないので未ログイン判定 →
    `/login`へリダイレクト、となっていた。**Site URLを`http://localhost:3000/set-password`に変更**
    （Redirect URLsは空のまま。Site URL自体は常に許可されるため）。
    **本番用プロジェクト（`wwvuxjvcwntqzdvyezss`）のSite URLは未変更**。本番で招待を使うときは
    本番ドメインの`/set-password`に設定し直すこと
  - **原因2: PKCE固定とimplicitハッシュの不整合（コードの不具合）** — `@supabase/ssr`の
    `createBrowserClient`は`flowType: "pkce"`を**上書き不可で固定**している
    （`node_modules/@supabase/ssr/dist/module/createBrowserClient.js:41`）。一方、
    ダッシュボード/`inviteUserByEmail`のリンクは`#access_token=...`のimplicit形式で戻るため、
    auth-jsの`_getSessionFromURL`が`Not a valid PKCE flow url`として**拒否**する
    （`GoTrueClient.js:3257`）。`set-password.tsx`の旧実装は`detectSessionInUrl`が
    両形式を自動検出する前提（Phase 4の「判断の記録」に書いた前提）だったが、
    **その前提は成り立っていなかった**。修正: ハッシュを自前で解析し`setSession()`で
    明示的にセッションを確立する方式へ変更
- [x] **`src/features/auth/lib/parse-auth-hash.ts` 新規作成（TDD）** — `parseAuthHash`。
      ハッシュを`{kind:'tokens'|'error'|'none'}`の判別可能ユニオンに変換する純粋関数。7テスト
- [x] **`src/features/auth/lib/auth-errors.ts` に`otp_expired`を追加** — リンク失効時の案内文。1テスト追加
- [x] **`src/routes/set-password.tsx` 書き換え** — マウント時に`establishSession()`で
      セッション確立 → 成功時のみフォーム表示（`checking`/`ready`/`unavailable`の3状態）。
      読み取り後`history.replaceState`でURLからトークンを消す。ハッシュが無い場合は
      既存セッションを確認してから判断
- [x] **解説ドキュメント生成/更新** — `docs/src/features/auth/lib/parse-auth-hash.html`（新規）、
      `docs/src/routes/set-password.html`（全面改稿）、
      `docs/src/features/auth/lib/auth-errors.html`（`otp_expired`の節を追記）
- [x] **`code-reviewer`の指摘2件を修正** —
  - **HIGH: StrictModeの二重実行によるレース** — 開発時のみ`useEffect`が2回走り、
    1回目がハッシュを消すため2回目は`kind:'none'`→`getSession()`経路に入る。
    `@supabase/ssr`は`auth.lock`を渡さないためauth-jsはロック無し経路を取り、
    ネットワーク往復のある`setSession()`より先に軽い`getSession()`が解決しうる
    （＝有効なリンクなのに「リンクから開いてください」と表示される）。
    `cancelled`フラグは結果を捨てるだけで二重実行自体は防げないため、
    `useRef`の実行ガードに変更した
  - **MEDIUM: `setSession()`の戻り値`data.session`未チェック** — 期限切れトークンの
    リフレッシュ失敗時に`error`なしで`session`だけ`null`になる分岐がある
    （`GoTrueClient.js:3035-3044`）。この場合フォームを出してしまい、送信して初めて
    分かりにくいエラーになるため、`data.session`も見て期限切れ扱いにした
- [x] **検証** — `npm run lint`/`npm run typecheck`エラー0、`npx vitest run`で50ファイル・302テスト全通過。
      ブラウザ（ポート3101）で「リンクなし」「期限切れリンク」「不正トークン」の3系統を確認。
      **有効な実リンクでの成功は依頼者の実機確認で確認済み**（パスワード設定→ログイン成功）
- **判明した運用上の落とし穴: メールのリンクは他端末に先に開かれるとその時点で失効する。**
  Supabaseの認証/APIログで、送信17秒後に**iPhoneのBrave**から`/verify`が成功し
  （＝使い捨てトークンを消費）、そのあとのPC Chromeからのアクセスが全て
  `One-time token not found`になっていたことを確認した。依頼者は「PCで1回しかクリックしていない」
  とのことで、iPhone側のメールアプリのプレビュー等が先に開いた可能性が高い。
  **リンク先が`localhost:3000`なのでiPhone側では何も表示されず、トークンだけが消える。**
  次回以降、メールリンクが期限切れになる現象が起きたら、まずAuth Logs/Edge Logsの
  ユーザーエージェントを確認すること（`/logs/edge-logs`で`user_agent`が見られる）
- **Supabase標準メールの送信レート制限は1時間あたり2通**。招待→再設定→再送で上限に達し
  `429`で送信できなくなった（ダッシュボードには「Failed to send password recovery」とだけ出る）。
  自前SMTPを設定しない限り変更できず、メールテンプレートの編集も同様にSMTPが必要
- [ ] **未着手: 本番でのリンク先読み対策** — 恒久対策は、メールテンプレートを`token_hash`方式
      （リンクを開いただけでは消費せず、画面のボタン押下で`verifyOtp`）に変えること。
      **カスタムSMTPの設定が前提**なので、依頼者と相談してから着手する

### 2026-09-20（UI刷新: デザインシステム導入とデータモデル変更）

依頼者から「レスポンシブ非対応・全ページ使いづらい」との指摘を受けた大規模改修。
Apple のデザイン言語の分析結果を `docs/design.md` として受領し、これを唯一の基準にした。
A（DB）→ B（純粋ロジック）→ C（デザインシステム）→ D（フォーム）→ E（調整）→ F（検証）の順で実施。

- [x] **Phase A: マイグレーション2本**（依頼者がSQL Editorで開発用に適用済み。**本番は未適用**）
      - `20260920110000_add_vehicle_model_code.sql` — 車両に `model_code`（型式・任意）
      - `20260920110100_rework_maintenance_work_types.sql` — 既存記録を全削除し、
        作業区分を9種へ入れ替え、`detail`/`oil_type`/`element_changed` を追加、`work_type_other` を削除。
        区分ごとの必須（部品交換は交換内容＋部品型式、など）をCHECK制約でも保証
      - 旧CHECK制約の削除は**制約名を決め打ちせず** `pg_constraint` を検索して drop する DO ブロックにした
        （インライン CHECK の名前は Postgres の自動採番に依存するため）
      - `database.types.ts` は**ダッシュボードのDocs画面からダウンロード**して差し替えた。
        **UIが変わっており、旧手順（API Docsの TypeScript タブ）は消滅**。
        現在は Data API → Docs → 「Generating types」の
        **Generate and download types ボタン**で `.ts` ファイルが落ちてくる
- [x] **Phase B: 純粋ロジック（TDD）**
      - `work-types.ts` を全面刷新。`workTypeFields()` が「区分ごとにどの欄を出すか・必須か」を返し、
        **フォームとスキーマの両方がこの1か所を読む**（画面と検証がずれない）。12テスト
      - `record-schema.ts` を区分別バリデーションへ。検証後に `.transform()` で
        その区分で使わない項目を空へ戻す（区分を切り替えた後の残骸をDBへ持ち込まない）。21テスト
      - `vehicle-schema.ts` に `modelCode` を追加。4テスト追加
- [x] **Phase C: デザインシステム**
      - `src/styles/{tokens,base,layout,nav,buttons,forms,cards}.css` を新設し `src/styles.css` が @import する構成。
        色・文字・余白・角丸は design.md の値をトークン化し、各ファイルに生の hex を書かない
      - `src/components/{app-nav,page-header}.tsx` を新設。ログアウトは全ページ共通のナビへ移動
      - **色を増やさない制約への対処**: 車検アラートの段階差を、赤などの色ではなく
        面の明暗（警告＝淡いカード／危険・期限切れ＝黒いタイル）で表現した
      - 反省: 「残りは Phase E でまとめて」と説明したまま先に進めたため、依頼者には
        **ほとんどのページが直っていない（むしろ旧 `main` のCSSを消した分悪化した）状態**に見えていた。
        指摘を受けて同セッション内で全ページに適用し直した。**部分適用の状態で止めない**こと
- [x] **Phase D: フォームと車検の統合**
      - `record-form.tsx` を作り直し。区分で入力欄が変わる。車検を選ぶと日付欄の見出しが「車検日」になり、
        有効期間と新しい満了日が出て、送信は `complete_shaken` RPC 経由になる（記録追加と満了日更新を1トランザクション）
      - **車検専用ページ `/vehicles/$id/shaken` と `complete-shaken-form.tsx` を削除**し、整備記録へ統合。
        「車検完了を記録」リンクは `/records/new?workType=shaken` を指す（`validateSearch` + `.catch(undefined)`）
      - 車検の入力項目は新仕様どおり車検日・走行距離・備考のみ。`completeShakenSchema` から `partDetail` を削除し、
        RPC 呼び出しからも `p_part_detail` を外した（RPC 側は default '' なので引数を省略できる）
- [x] **Phase E: 実データでの調整**（使い捨てユーザー＋車両2台・記録5件を投入して全画面を確認）
      - 整備記録一覧の操作ボタンを行の右端へ（`.list-row .card-actions { margin-left: auto }`）
      - 絞り込みセレクトが全幅に伸びるのを 320px で止める（`.field-compact`）
      - ダッシュボードのログイン中メールを 28px から補足サイズへ（スマホで2行に折り返していた）
      - 未来日付の記録で「前回整備 …（-5日前）」と出ていたのを、日数がマイナスなら出さないよう修正
- [x] **Phase F: E2E更新と検証**
      - `PageHeader` を `<h1>` に変更（サブナビのページ名が唯一の主見出し）。本文側は `<h2>` から始める。
        それまで**見出し要素が無いページがあり**、E2Eのheading指定も失敗していた
      - E2E 5ファイルを新UIに追随（リンク名「整備を記録」、ラベル「部品型式」、車検は `?workType=shaken`、
        車両一覧の見出しは「車両」、ダッシュボードは「ダッシュボード」）
      - `npm run test:e2e`: 26件成功・2件flaky（リトライで成功。Phase 8 から続くハイドレーション待ちの不安定さ）

**未着手・持ち越し**
- 本番Supabase（`wwvuxjvcwntqzdvyezss`）へのマイグレーション2本の適用と、本番へのデプロイ
- 本番の Site URL は `https://vehicle-maintenance.y-kakeibo.workers.dev/set-password` に変更済み

### 2026-09-20（ホーム画面アイコン対応）

依頼者から「iPhoneでホーム画面に登録すると頭文字1文字の味気ないアイコンになる。
`image/icon.jpg` を使いたい」との依頼。

- [x] **`tools/generate-icons.py` を新設**し、`image/icon.jpg` から `public/` のアイコン9点を生成
      - **元画像の落とし穴**: 一見透過しているが、実際は「透過を表す市松模様」が
        描き込まれた JPEG でアルファチャンネルは無い。青い角丸スクエアの位置を
        画素走査で実測（`RECT = (255, 256, 769, 769)`、角丸半径 104）して切り出す必要がある
      - **角丸のまま切ると四隅に市松模様が残る**ため塗り足しが要る。2次曲面で背景の
        グラデーションを近似して埋める方法を試したが、**境界に約10階調の段差**が出た。
        最終的に**角丸に内接する正方形**（`INSET = 40`）を切り出す方式にした。
        全画素が元画像そのままなので継ぎ目が原理的に出ない。ロゴ周囲の余白は十分あり絵柄は欠けない
      - **アイコンの角は丸めない**。iOS / Android が自前で角丸マスクをかけるため、
        こちらで丸めると二重に丸まって縁に隙間が出る
      - maskable 版は中央 78% にロゴを収め、外周は `np.pad(mode="edge")` で端の画素を
        複製して埋めた（新しい色を作らないので継ぎ目が出ない）
- [x] **`public/` を新設**（このプロジェクト初の静的アセットディレクトリ）
      `apple-touch-icon.png`(180) / `icon-{192,512}.png` / `icon-maskable-{192,512}.png` /
      `favicon-{16,32}.png` / `favicon.ico`(16,32,48) / `manifest.webmanifest`
- [x] **`src/routes/__root.tsx` に `link` / `meta` を追加**
      - **iOS は manifest の `icons` を読まない**。`rel="apple-touch-icon"` だけを見るので、
        manifest だけ用意しても iPhone では効かない。ここが今回の要点
      - `theme-color: #000000`（上部ナビの黒 `--surface-black` に合わせた）
      - `apple-mobile-web-app-title: CAR DOC`（`<title>`の「車両メンテナンス記録」は
        ホーム画面ラベルとしては長すぎて省略される）
- [x] `docs/src/routes/__root.html` を生成、`docs/index.html` の目次とフォルダ構成表を更新
- [x] 検証: `npm run typecheck` 通過 / dev サーバー(3101)で9アセット全て 200・
      Content-Type 正常・head出力正常・コンソールエラー無し
- [x] **本番デプロイ済み**（`npm run build` → `npx wrangler deploy`、Version ID
      `55110218-c9fc-4140-82f1-4fbfb591614d`）。本番URLで9アセット全て 200 を確認、
      `apple-touch-icon` が 180x180 でデコードできることも確認
      - 配信の仕組み: `dist/server/wrangler.json` の `"assets": {"directory": "../client"}`。
        Vite が `public/` を `dist/client` へコピーするので、`public/` に置けばそのまま配信される

**意図的にやらなかったこと**
- **`apple-mobile-web-app-capable` は入れていない**。iOS のスタンドアロンモードは
  Safari と別ストレージになるため、招待/パスワード再設定メールのリンク（Safari で開く）で
  確立したセッションがホーム画面アプリ側に引き継がれない。依頼者が
  「ブラウザで操作する」と言っている現状の挙動を変えない方を選んだ。
  manifest の `display: "standalone"` は Android 側のみに効く（iOS は無視する）

## 判断の記録

- **サブエージェントは4種類ともグローバルに実在し、新規作成は不要と確定した。**
  場所: C:\Users\barub\.claude\agents\ （このプロジェクトの .claude/agents/ ではない）
  - code-reviewer.md — バグ検査
  - e2e-runner.md — UI検証（Playwright MCP 経由）
  - security-reviewer.md — セキュリティ確認
  - database-reviewer.md — DB/RLS確認
  依頼者から2回確認が入り、いずれも実ファイルの存在を ls で確認して回答済み。
  **プロジェクト専用の上書き版は作らない。** レビュー依頼時にプロンプトで
  このプロジェクト固有の観点（JST問題・RLS・車検ドメイン・モバイルファースト等）を
  都度渡す方針とする

  反省点: 最初にこの4つを案内した表では、e2e-runner/code-reviewer は
  システムのエージェント一覧で確認済みだったため「グローバルに存在」と明記したが、
  security-reviewer/database-reviewer は依頼者の rules/common/agents.md に
  名前があるだけで実ファイルを ls していなかった。それなのに表では両者を
  並べて書いてしまい、確認の粒度が違うことを隠す結果になった。依頼者から
  指摘されて初めて4つとも ls で検証した。次回以降、複数のエージェント/ツールの
  存在を案内するときは、確認済みのものと未確認のものを表記で明確に区別すること。
- **検証系コマンド（lint/typecheck/test/build/dev）は事前承認済み**で毎回止まらない。
  インストール・デプロイ・本番DB適用・大容量DL・削除は都度承認
- **マイグレーション適用に`supabase` CLI（`link`/`db push`）を使わない方針にした。**
  理由: これらのコマンドはDBパスワードまたは個人アクセストークンの入力を要求するが、
  Claudeはパスワード・APIキー・トークンの入力代行を行わない方針（`docs/setup-supabase.md`
  でも当初から「secret keyとDB Passwordは送らないでください」と依頼者に案内済み）。
  代わりに、生成したSQLを依頼者がSupabaseダッシュボードのSQL Editorに直接貼り付けて
  実行する運用にした。`supabase gen types typescript`も同じ理由で依頼者自身に実行してもらう。
  次回以降、DB関連の認証情報が絡む操作が出てきたら同じ考え方で判断すること
- **`database.types.ts`生成も、CLI（個人アクセストークン必要）ではなくSupabaseダッシュボードの
  API Docs画面から直接コピーする方法を採用した。** 依頼者が別セッションでこの方法を見つけて提案し、
  「秘密情報を一切作らない」という上記の方針により合致すると判断して採用。
  手順: 開発用プロジェクトを開く→アドレスバーに`/api?page=tables-intro`を追加してAPI Docsを開く→
  TypeScriptタブの型定義を全文コピー→Claudeに貼り付けてもらい`src/lib/supabase/database.types.ts`
  として保存。次回、型の再生成が必要になったときも同じ方法を使うこと

- **Supabaseクライアントの配置を、プラン記載の`src/lib/supabase/{client,server}.ts`から
  `src/integrations/supabase/{client,server}.ts`へ変更した。**
  理由: `src/**/lib/**`にはReact/TanStack/Supabaseのimportを禁止するESLintの境界ルールが
  既に敷かれており、client.ts/server.tsは`@supabase/ssr`のimportが必須のため文字通り矛盾する。
  境界ルールを緩めず（例外を増やすと1か月で崩れる、と当のESLintコメントに書いてある）、
  「外部SDKをこのアプリに配線する層」として`integrations/`を新設（TanStack Startの作例で
  実際に使われている命名）。`src/lib/supabase/env.ts`だけは純粋（Supabase自体をimportしない）
  ので`lib/`に残した。次回以降、似た「SDKラッパーだがlib/に置きたくなるもの」が出たら
  `integrations/`を使うこと
- **プラン文書の「Cookieはhttpolyに」という記述は誤りと判明、訂正して実装した。**
  理由: Supabase公式ドキュメント（Auth Server-Side Rendering → Advanced guide、
  "How do I make the cookies HttpOnly?"の項）が「不要」と明記。`@supabase/ssr`は
  ブラウザ側クライアントがリフレッシュトークンを読み書きしてセッションを維持する設計であり、
  httpOnlyにするとその読み書きができなくなり、招待リンクの自動セッション確立
  （`detectSessionInUrl`）やトークンリフレッシュが壊れる。実装は`@supabase/ssr`の
  デフォルト（`httpOnly: false`/`sameSite: 'lax'`）のまま、`cookieOptions`を一切上書きしていない。
  次回以降、プランに書かれた内容でも「最新APIとの差分」の対象になりうる技術的決定は
  実装前に公式ドキュメントで裏取りすること（このプロジェクトのCLAUDE.mdが既に
  「訓練知識は古い」と注記している領域）
- **サーバー関数のテスト用handler関数にデフォルト引数で`createSupabaseServerClient()`を
  埋め込むと、TanStack Startのビルドが import-protection エラーで失敗することが判明。**
  理由: `_authed.tsx`（クライアントにもバンドルされる）が`getSessionFn`を使うために
  `get-session.ts`をimportすると、デフォルト引数として書かれた
  `createSupabaseServerClient`（`@tanstack/react-start/server`に依存）への参照が
  モジュールのトップレベルから静的に見え、クライアントバンドルに巻き込まれてしまう。
  対策: `xxxHandler(deps: XxxDeps)`のdepsを必須にし、`createSupabaseServerClient()`の
  呼び出しは`createServerFn(...).handler(() => xxxHandler({ supabase: createSupabaseServerClient() }))`
  という`.handler()`コールバックの中だけに押し込める（`get-session.ts`/`login.ts`/`logout.ts`
  で統一）。次回以降、`features/*/server/`にサーバー関数を追加するときはこのパターンを踏襲すること
- **招待メール（`inviteUserByEmail`）はPKCE非対応と判明。** Supabase公式ドキュメントが
  「招待する側とリンクを踏む側でブラウザが異なるため」と明記。そのため招待リンクは
  `?code=`ではなく`#access_token=...&type=invite`のハッシュフラグメント形式になる。
  ~~`set-password.tsx`はブラウザ用クライアントの`detectSessionInUrl`（デフォルトtrue）が
  どちらの形式も自動検出する前提で実装~~ → **2026-09-20に誤りと判明。**
  `@supabase/ssr`は`flowType: "pkce"`を上書き不可で固定するため、implicit形式のハッシュは
  `detectSessionInUrl`に拒否される。ハッシュを自前で解析して`setSession()`を呼ぶ方式に修正済み
  （詳細は上記「2026-09-20」の節）。専用のサーバー側コールバックルートは今も作っていない
- **スキャフォールドのプレースホルダー`src/routes/index.tsx`（「Welcome to TanStack Start」）を
  削除した。** 理由: 新設した`src/routes/_authed.index.tsx`（ログイン後の仮ホーム画面）も
  URL `/`を指すため、両方存在するとルート定義が衝突する。ダッシュボード本体はPhase 7で
  `_authed.index.tsx`の中身を差し替える
- **`src/routes/_authed.index.tsx`はPhase 7の本実装が入るまでの仮ページとして意図的に追加した
  （プランのPhase 4スコープ文には無いファイル）。** 理由: `_authed`ガードの下に子ルートが
  1つも無いと、ログイン成功後の画面遷移をブラウザで実際に確認する手段が無く、
  「フロントエンドの変更はブラウザで動作確認してから完了とする」という開発方針を
  満たせなかった。中身は次回Phase 7で丸ごと置き換える前提の最小限の実装（メールアドレス表示＋
  ログアウトボタンのみ）

### Phase 8（検証とデプロイ）— レビュー・E2E・修正まで完了。デプロイのみ未着手

- [x] **`code-reviewer`/`security-reviewer`/`database-reviewer`の3エージェントを並列実行**
      （初めての全体レビュー。差分だけでなくコードベース全体を対象にした）。
      見つかった指摘: コードHIGH1件・Medium3件・Low2件、セキュリティMedium/High1件・Medium1件・Low2件、
      DBはテストギャップ4件（実装自体は健全）
- [x] **Playwright E2E一式を新規構築**（`e2e-runner`エージェント経由。レート制限で一度中断し
      `SendMessage`で再開）。`playwright.config.ts`＋`e2e/support/*`＋`e2e/tests/*.spec.ts`（8ファイル）。
      `mobile`（Pixel 5）/`desktop`（1280×800）の2プロジェクトで8シナリオ全て（26テスト）成功。
      調査の過程で「TanStack Startのフレームワーク側の不具合では」と一時疑われたが、
      最終的にはテスト側の2つの問題（ハイドレーション待ち不足・`getByLabel`のexact一致が
      `<select>`では効かない）に起因すると判明し、アプリ本体の修正は不要だった。
      副次的に、テストユーザーのロールバック漏れで開発用Supabaseにゴミユーザー12件が残留する
      不具合も見つけて修正・削除済み。解説ドキュメント`docs/e2e.html`を新規作成
- [x] **レビュー指摘のうちHIGH+Medium全てを修正**（依頼者の指示で対応範囲を確定）:
  - `src/lib/url/safe-redirect.ts`（新規）— ログイン後リダイレクトのオープンリダイレクト対策
    （`isSafeRedirectPath`。`/login?redirect=`に絶対URLを許容していた脆弱性）。TDDで実装。
    `docs/src/lib/url/safe-redirect.html`新規作成
  - `src/integrations/supabase/server.ts` — `cookieOptions: { secure: true }`を追加
    （`httpOnly: false`は意図どおり維持、`secure`だけ多層防御として追加）
  - `src/lib/date/format-ja.ts` — **date-fns依存を完全に除去**し、`getUTCFullYear()`等の
    UTCゲッターだけで実装し直した。旧実装（`date-fns`の`format()`）は実行環境のローカル
    タイムゾーンに依存するバグを抱えていた（西経タイムゾーンで前日にずれる）。
    日本国内の開発機・TZ=UTCのCloudflare Workersでは顕在化しないため気づかれていなかった
  - `_authed.index.tsx`／`_authed.vehicles.$vehicleId.index.tsx` — ログアウト・車両削除・
    整備記録削除の`catch`欠落（エラー握りつぶし）を修正。他のフォームと同じ
    エラー表示パターンに統一
  - `_authed.vehicles.$vehicleId.edit.tsx`／`.records.$recordId.edit.tsx` — `updateVehicleFn`/
    `updateRecordFn`が返す`null`（RLSブロック・削除済み等）を無視していたのを修正
  - `supabase/migrations/20260919220000_fix_complete_shaken_ownership_check.sql`（新規）—
    `complete_shaken`の所有権チェックを`insert`より前に移動。旧実装は他人の車両IDを渡すと
    複合FK違反の生エラーメッセージがクライアントに漏れていた（実害は限定的だがスキーマ情報の漏洩）。
    **依頼者が開発用・本番用の両SupabaseプロジェクトへSQL Editor手動貼り付けで適用済み**
  - `supabase/tests/rls.test.ts` — DBレビューで指摘されたテストギャップ4件を追加
    （maintenance_recordsのUPDATE WITH CHECK、複合FK経由のUPDATE防止、complete_shaken RPCの
    正常系/異常系）。マイグレーション適用後の`complete_shaken`異常系テストに、意図した
    エラーメッセージ（`'vehicle not found or not owned by current user'`）であることの
    アサーションを追加し、開発用プロジェクトに対して9件全て成功することでマイグレーション適用を確認済み
  - 関連するdocs/*.htmlを全て更新・新規作成済み（`login.html`/`server.html`/`format-ja.html`/
    `_authed.index.html`/`_authed.vehicles.$vehicleId.index.html`/`.edit.html`/
    `.records.$recordId.edit.html`/`migrations.html`/`tests/rls.html`）
- [x] **修正後、lint/typecheck/test:coverage(294テスト)/build/test:rls(9テスト)/test:e2e(26テスト)
      全てgreenを再確認**
- [x] **`complete_shaken`修正マイグレーションを開発用・本番用Supabaseへ適用**（依頼者がSQL Editorへ
      手動貼り付け。開発用プロジェクトはテストで適用確認済み）
- [x] **`wrangler login`完了確認**（`npx wrangler whoami`で認証済みアカウント
      `t.yamazaki.1129@gmail.com`を確認）
- [x] **`npm run deploy`で本番デプロイ完了** — https://vehicle-maintenance.y-kakeibo.workers.dev
      未ログインアクセスでログイン画面が正しく表示されること、コンソールエラーが無いことを確認済み。
      **実際のアカウントでのフルログイン確認は依頼者に委ねた**（本番で使い捨てテストユーザーを
      作りたくないため）
- [ ] 見送った指摘（依頼者の判断で今回はスコープ外）: enum文字列の型キャスト重複（Low）、
      フォームの`initialValues`に`key`未指定（Low）、DB由来の生エラーメッセージが一般的に
      漏れる問題（Low、`complete_shaken`以外の全サーバー関数）、`npm audit`のsharp経由
      devDependency脆弱性4件（wrangler/miniflare経由、本番バンドル非対象）、
      `date-fns`パッケージ自体が今や未使用（`format-ja.ts`からの依存除去後。package.jsonからの
      削除は未実施 — 依頼者に確認してから`npm uninstall`すること）

## 次にやること

**実装プランの全フェーズ完了後、2026-09-20 にUI刷新（Phase A〜F）を実施。**

- **本番用Supabaseへマイグレーション2本を適用する**（開発用と同じSQL Editor手動貼り付け）
- 適用後に `npm run deploy` で本番へデプロイする
- 本番で招待 → パスワード設定 → ログインを通しで確認する（開発環境では成功済み）

- **本番で招待を使う前に、本番用Supabase（`wwvuxjvcwntqzdvyezss`）のSite URLを
  `https://vehicle-maintenance.y-kakeibo.workers.dev/set-password`に変更する**（未実施）
- 依頼者が実際のアカウントでの本番ログインを確認する（未実施。開発環境では成功済み）
- メールリンクの先読み対策（`token_hash`方式＋カスタムSMTP）は依頼者と相談してから
- 見送った指摘（Phase 8参照）や`date-fns`の`package.json`からの削除も、依頼者の判断待ち

## 次のセッションで最初にやること

このファイルを読んだら、`npm run test:coverage` を実行して現状の 302 テストが
全て通り、カバレッジが崩れていないことを確認する
（要承認だが事前承認済みのコマンドなので確認だけで進めてよい）。
**中断時点**: 全フェーズ（0〜9）完了・本番デプロイ済み
（https://vehicle-maintenance.y-kakeibo.workers.dev ）。
開発環境では招待→パスワード設定→ログインまで実機で成功済み。
本番でも招待→パスワード設定→ログインを依頼者が実機で確認済み。
未コミットの変更は無い（`519f721` のナビ修正までコミット済み・本番デプロイ済み）。

**次にやること**: 依頼者が実データを入力して使用中。不具合の報告を待つ。
報告が来たら再現 → `superpowers:systematic-debugging` で原因特定 → 修正。
着手待ちの既知の課題は 404 ページのみ（下記「保留」）。

**スマホ幅のナビ崩れを修正（2026-09-20、コミット `519f721`）**: ログアウトボタンが
2行に折り返して黒バーの高さが崩れる不具合を修正した（依頼者からスクショで報告）。
変更は CSS 2ファイルのみで TS/TSX には触れていない。

- `src/styles/buttons.css` — `.btn-utility` に `white-space: nowrap` を追加（折り返し＝高さ崩れの直接原因）。
  480px 以下で `padding: 6px 10px` / `font-size: --text-fine-size` に詰める指定を追加
- `src/styles/nav.css` — `.nav-brand` に `min-width: 0` / `overflow: hidden` / `text-overflow: ellipsis`、
  `.nav-links` に `flex-shrink: 0`。480px 以下で `.nav` の gap を `--space-sm`、
  `.nav-brand` を `--text-fine-size` に。**幅不足のしわ寄せを必ずアプリ名側（省略表示）へ流す**のが設計意図
- **設計判断**: ハンバーガーに畳まない既存方針は維持。ナビ内で読めなくても困らないのは
  アプリ名だけなので、そこだけを縮む要素にした
- **ブラウザ実測で検証済み**（dev サーバー＋ナビDOMを注入して計測）:
  375px → バー 44px / ボタン 65.6×32 の1行 / アプリ名は省略なし（約66px の余裕）、
  320px → バー 44px 維持・ボタン1行のまま・アプリ名のみ `…` で省略、
  481px・768px → 従来どおり（バー 44px / ボタン 82.5×32 / 省略なし）。横スクロール発生なし
- `docs/src/styles/nav.html` と `docs/src/styles/buttons.html` も更新済み（CLAUDE.md ルール2）
- **本番デプロイ済み** — `npm run deploy` 実行、Version ID `b3508c14-5b18-475a-bf67-f2358a8f4c77`。
  本番の配信 CSS（`/assets/styles-BaIWR21J.css`）を 375px で実測し、
  バー 44px / ボタン 65.6×32（font 12px・padding 6px 10px・nowrap）/
  アプリ名 12px 省略なし / 横スクロールなし を確認
- **未実施**: `npm run test:coverage` と Playwright E2E は未実行（CSS のみの変更のため）

**`docs/architecture.html` を新設（2026-09-20）**: 依頼者から「アプリがどう動いているか
（DB アクセス経路・Cloudflare と Supabase の通信・招待フロー）を知りたい」という質問を受け、
口頭説明した内容を docs に残したもの。ファイル単位ではなく**動作の流れ**で説明するページ。

- 構成: 全体構成 / デプロイ成果物 / DB アクセス経路 / RLS が安全性の境界である理由 /
  認証と Cookie（2つのクライアント）/ **招待フロー全体像** / 車検 RPC / Workers 固有の制約
- `docs/index.html` のナビと冒頭から相互リンク済み。内部リンク9件はファイル存在を確認済み
- **docs のリンク色を修正（依頼者から「藍色の背景に青リンクは見にくい」と指摘）** ——
  原因は `docs/assets/doc-style.css` に `a` の規則が1つも無く、ブラウザ既定色
  (`#0000EE` / 訪問済 `#551A8B`) が使われていたこと。ダーク背景 `#0d1117` 上での
  コントラスト比は **2.01:1 / 1.72:1** で WCAG AA (4.5:1) を大きく下回っていた。
  `--doc-link` / `--doc-link-visited` トークンを新設し、全 `a` を明示的に塗った
  （ライト: `#0969da` 5.19:1 / `#8250df` 5.05:1、ダーク: `#58a6ff` 7.49:1 /
  `#d2a8ff` 9.72:1）。ダークの `--doc-accent` も `#4493f8` → `#58a6ff` に引き上げ。
  **この1ファイルの修正で docs 配下の全ページに効く**
- **さらに「他のページもリンク文字が青くて見にくい」と再指摘があり、配色方針を変更**——
  一覧ページはカード見出しが全部リンクのため、リンク＝青にすると画面が青一色になる。
  依頼者に選択肢を提示して**「UI は白文字、本文リンクのみ色」**を選択。
  カード見出しとナビのピルを `--doc-fg`（ほぼ白・16:1）にし、押せることは枠線と
  ホバー時の枠色で示す。本文中のリンクだけ `--doc-link` を明るい水色 `#a5d6ff`
  (12.31:1) に引き上げ＋下線を維持。**背景 `#0d1117` が青みを帯びているため、
  輝度差だけ確保しても色相が近いと沈んで見える**というのが今回の学び
- 変更ファイル: `docs/assets/doc-style.css`（トークン）、`docs/index.html`
  （ピル・カード見出し・注記リンク）、`docs/architecture.html`（ピル・脚注リンク）
- **ついでに `scripts/invite-user.ts` のコメントの誤りを訂正**——「ブラウザ用クライアントが
  自動検出してセッションを確立する」と書かれていたが、実際は `@supabase/ssr` が
  flowType を pkce 固定にしているため自動検出は働かず、`set-password.tsx` が
  `parseAuthHash` で自前解析して `setSession()` している。コメントだけが実装と食い違っていた

**保留（依頼者が後回しと判断）**
- 存在しないURLを開くと TanStack Router 既定の素の `Not Found` が出る。
  `notFoundComponent` でデザインに合わせた日本語の404ページを用意する

**ホーム画面アイコンは本番へデプロイ済み**。iPhone 側で既にホーム画面に追加済みの場合、
**一度削除して追加し直さないと古いアイコンがキャッシュされたまま**になる点に注意。

---

## 確定仕様（再議論しない）

| 項目 | 決定 |
|---|---|
| 車両登録 | 複数台。車種名・車両区分（車/バイク）・車検満了日（**任意**。250cc 以下は車検なし） |
| 車検アラート | **アプリ内表示のみ**。メール/Push/LINE・Cron・定期実行は一切作らない |
| アラート閾値 | 残り2ヶ月→警告、残り1ヶ月→危険、超過→期限切れ。**暦月**判定（30/60日ではない） |
| 車検更新 | +2年（既定）/+3年（新車初回）を選択。**制度どおり**、満了日1ヶ月前以内の受検は「旧満了日＋N年」で繰り越し。計算結果を表示し手動修正も可 |
| 整備記録 | 日付・作業内容・走行距離・部品/型式・備考 |
| 作業内容 | **プリセット＋自由入力**（エンジンオイル/オイルエレメント/タイヤ/ブレーキパッド/バッテリー/車検/その他） |
| 部品・型式 | **単一の自由入力欄**＋過去入力値のサジェスト |
| データ共有 | **完全に個人ごと**。RLS で `auth.uid() = user_id` |
| 認証 | メール＋パスワード。公開サインアップ無効、オーナーが招待。`/set-password` 画面あり |
| UI | **モバイルファースト**、PC でも自然に見える |

---

## 依頼者にお願いする作業（Claude が代行できない）

- [x] **Supabase アカウント作成＋プロジェクトを 2 つ作成**（`vehicle-maintenance-dev` と `vehicle-maintenance`)
      → 完了。dev: `rldmmiyhlnasghubigua`、本番: `wwvuxjvcwntqzdvyezss`（Reference ID）
- [x] Supabase ダッシュボードで公開サインアップを無効化 — **dev/本番の両方で無効化済み**と確認済み
- [x] 2 プロジェクト分の `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` の取得・共有
      → `.env`（dev用）と `.env.production.local`（本番用）に保存済み。両方 `.gitignore` 対象を
      `git check-ignore -v` で確認済み。共有された URL には `/rest/v1/` が付いていたためベースURLのみ抽出
- [ ] デプロイ時の `wrangler login`
- [x] Cloudflare アカウント — **保有済み**

---

## 未解決事項・注意点

- Supabase プロジェクトが無いと Phase 2（DB）以降が進まない。Phase 1（骨組み）は先行できる
- スキャフォールドは空ディレクトリを要求する可能性あり。既存の `.claude/` `docs/` `tools/` を壊さないよう、
  temp ディレクトリで生成してから中身を移す方針
- `npm create @tanstack/start` は**廃止済み**。`npx @tanstack/cli create` を使う
- Supabase の `anon` キーは**廃止済み**。`sb_publishable_...`（`VITE_SUPABASE_PUBLISHABLE_KEY`）を使う

## スキャフォールドで判明した実際の構成（設計時の想定との差分）

- **Vite 8 / TypeScript 6 / React 19.2 / wrangler 4.70** が入る
- `vite.config.ts` は `resolve: { tsconfigPaths: true }` を使う
  → **`vite-tsconfig-paths` パッケージは不要**（Vite 8 に内蔵された）
- パスエイリアスは `#/*` と `@/*` の**両方**が tsconfig に定義済み。`@/*` を使う
- `package.json` の `imports` フィールドで `#/*` → `./src/*` が定義されている
- TanStack 系パッケージのバージョンは `"latest"` 指定。将来固定する可能性あり
- 雛形には**テスト環境が一切含まれない**（`--blank` のため）。Vitest / Playwright は自前で追加する
- `eslint.config.js` は `@tanstack/eslint-config` を継承。ここに import 制限ルールを足す

## 実際に入ったバージョン（⚠️ 設計時の想定と違うもの）

| パッケージ | バージョン | 注意 |
|---|---|---|
| **vitest** | **5.0.0** | ⚠️ 設計は Vitest 4 想定。`projects` や `coverage.thresholds` の書き方を**公式ドキュメントで確認してから**設定を書く |
| **zod** | **4.5.4** | ⚠️ Zod 4 系。`z.string().email()` → `z.email()` など記法が変わっている。スキーマ作成時に確認する |
| eslint | 9.39.5 | deprecated 警告が出るが `@tanstack/eslint-config` は `^9 \|\| ^10` を受け入れるので動作する。将来 10 に上げてよい |
| typescript | 6.0.2 | かなり新しい |
| vite | 8.0.0 | 〃 |
| @supabase/supabase-js | 2.115.0 | |
| @supabase/ssr | 0.12.6 | |
| @playwright/test | 1.63.0 | ブラウザ本体は未ダウンロード（`npx playwright install chromium` が別途必要） |
| supabase (CLI) | 2.116.0 | |
| date-fns | 4.4.0 | **表示整形専用**。計算には使わない |

---

## フェーズ一覧（進捗チェック用）

- [x] Phase 0 — 環境準備
- [~] Phase 1 — 骨組み（スキャフォールド✅ / vite・wrangler✅ / vitest✅ / eslint ルール✅ / 専用エージェント未）
- [x] Phase 2 — DB とマイグレーション（4 migration + RLS 統合テスト + 型生成 + 本番適用）
- [x] Phase 3 — 純粋ロジック（TDD）`lib/date/*`, `features/*/lib/*` ← **全完成（date/shaken/vehicles/maintenance/dashboard/auth）**
- [x] Phase 4 — 認証（Supabase クライアント、login/set-password、_authed ガード、招待スクリプト。ブラウザで動作確認済み）
- [x] Phase 5 — 車両 CRUD（server 5本 + vehicle-form + ルート5本。ブラウザで動作確認済み）
- [x] Phase 6 — 整備記録 CRUD（server 5本 + record-form + ルート3本。ブラウザで動作確認済み）
- [x] Phase 7 — ダッシュボードと車検アラート（complete-shaken RPC + ダッシュボード/車検UI。ブラウザで動作確認済み）
- [x] Phase 8 — 検証（E2E / レビュー）とデプロイ（レビュー✅ / E2E✅ / 指摘修正✅ / マイグレーション適用✅ / デプロイ✅）
- [x] Phase 9 — docs の HTML 解説ページ（各ファイル解説✅ / プロジェクト全体解説ページ✅ `docs/index.html`）
