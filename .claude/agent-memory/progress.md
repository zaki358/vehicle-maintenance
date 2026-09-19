# 進捗記録 — vehicle-maintenance

> **セッション開始時、まずこのファイルを読むこと。**
> 実装プラン全文: `C:\Users\barub\.claude\plans\tanstack-star-goofy-quill.md`

最終更新: 2026-09-19(Phase 4 完了。認証まわりのブラウザ動作確認まで完了)

---

## 現在地

**Phase 1〜4 完了。次はPhase 5(車両CRUD)。**
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
  `set-password.tsx`はブラウザ用クライアントの`detectSessionInUrl`（デフォルトtrue）が
  どちらの形式も自動検出する前提で実装しており、専用のサーバー側コールバックルートは
  作っていない
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

---

## 次にやること

**Phase 4（認証）— 完了。**

- ~~Supabase クライアント（サーバー用・ブラウザ用）の実装~~ — **完成済み**
- ~~login/set-password 画面~~ — **完成済み**
- ~~`_authed` ルートガード~~ — **完成済み**（ブラウザでログイン→仮ホーム→ログアウトの
  一連の流れを実際に確認済み）
- ~~招待スクリプト~~ — **完成済み**（`scripts/invite-user.ts`。Claude は未実行、
  依頼者が実際に招待したいタイミングで自分で実行する）

**次は Phase 5（車両 CRUD）に着手する**:
`features/vehicles/server/(list,get,create,update,delete)` と関連ルート
（`_authed.vehicles.{index,new}.tsx`、`_authed.vehicles.$vehicleId.*`）。
車検満了日が任意であること（250cc 以下のバイクは車検なし）を UI で自然に扱う。
`src/routes/_authed.index.tsx` は Phase 4 で作った仮のログイン後ページなので、
本来のダッシュボード実装（Phase 7）まではこのまま残しておいてよい
（Phase 5 では車両一覧の画面自体は増えるが、`/` の中身はまだ差し替えない）。
実装プラン全文の該当箇所（`C:\Users\barub\.claude\plans\tanstack-star-goofy-quill.md`）を
先に読み直してから着手すること。

## 次のセッションで最初にやること

このファイルを読んだら、`npm run test:coverage` を実行して現状の 223 テストが
全て通り、カバレッジが崩れていないことを確認する
（要承認だが事前承認済みのコマンドなので確認だけで進めてよい）。
**中断時点**: Phase 4 完了。Phase 5（車両 CRUD）に未着手。
まだ未コミットの変更（`src/integrations/`・`src/lib/supabase/env*`・`src/features/auth/*`・
`src/routes/{_authed*,login,set-password}.tsx`・`scripts/invite-user.ts`・
`eslint.config.js`・`docs/`・`.claude/launch.json` など）があるので、
コミットするかどうか依頼者に確認する。
**中断時点**: Phase 2 完了。Phase 4（認証）に未着手。
まだ未コミットの変更（`supabase/`・`docs/supabase/`・`vitest.rls.config.ts`・
`package.json`・`docs/setup-supabase.md`）があるので、コミットするかどうか依頼者に確認する。

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
- [ ] Phase 5 — 車両 CRUD
- [ ] Phase 6 — 整備記録 CRUD
- [ ] Phase 7 — ダッシュボードと車検アラート
- [ ] Phase 8 — 検証（E2E / レビュー）とデプロイ
- [ ] Phase 9 — docs の HTML 解説ページ
