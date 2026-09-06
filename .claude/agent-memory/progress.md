# 進捗記録 — vehicle-maintenance

> **セッション開始時、まずこのファイルを読むこと。**
> 実装プラン全文: `C:\Users\barub\.claude\plans\tanstack-star-goofy-quill.md`

最終更新: 2026-09-06（`features/maintenance/lib` 完成）

---

## 現在地

**Phase 1 完了。Phase 3（純粋ロジック）終盤。**
`src/lib/date/*`（5ファイル）、`src/features/shaken/lib/*`（4ファイル）、
`src/features/vehicles/lib/*`（3ファイル）、`src/features/maintenance/lib/*`（6ファイル）
がすべて TDD で完成し、**175 テスト・カバレッジ全指標 100%**。
専用サブエージェント作成は優先度を下げた（下記「判断の記録」参照）。

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

---

## 次にやること

Phase 3 の残り（Supabase 待ちの間、引き続き進められる）:

1. ~~**`features/vehicles/lib/*`**~~ — **完成済み**（`vehicle-schema.ts` / `vehicle-type.ts` / `shaken-required.ts`）
2. ~~**`features/maintenance/lib/*`**~~ — **完成済み**（`work-types.ts` / `record-schema.ts` /
   `filter-records.ts` / `sort-records.ts` / `part-suggestions.ts` / `odometer.ts`）
3. **`features/dashboard/lib/*`** — `since-last-service.ts`、`build-summary.ts`
4. **`features/auth/lib/*`** — `login-schema.ts`（Zod）、`auth-errors.ts`

そのあと **Phase 2（DB とマイグレーション）** — **依頼者の Supabase プロジェクト作成待ち**。
Phase 3 が終わっていれば、DB ができ次第 Phase 4（認証配線）にすぐ入れる。

## 次のセッションで最初にやること

このファイルを読んだら、`npm run test:coverage` を実行して現状の 175 テストが
全て通り、カバレッジが崩れていないことを確認してから続きに着手すること
（要承認だが事前承認済みのコマンドなので確認だけで進めてよい）。
次は「次にやること」の 3番目 `features/dashboard/lib` から着手する。

**中断時点**: `src/lib/date/*`・`src/features/shaken/lib/*`・`src/features/vehicles/lib/*`・
`src/features/maintenance/lib/*` が完成し、コミット済み。次は `features/dashboard/lib` から着手する。

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

- [ ] **Supabase アカウント作成＋プロジェクトを 2 つ作成**（`vehicle-maintenance-dev` と `vehicle-maintenance`)
      → 手順書 `docs/setup-supabase.md` を送付済み。**これが完了しないと Phase 2 に進めない**
- [ ] Supabase ダッシュボードで公開サインアップを無効化（Authentication → Sign In / Providers → Email）
- [ ] 2 プロジェクト分の `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` の取得・共有
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
- [ ] Phase 2 — DB とマイグレーション（4 migration + RLS 統合テスト）
- [~] Phase 3 — 純粋ロジック（TDD）`lib/date/*`, `features/*/lib/*` ← **date/shaken/vehicles/maintenance 完成、次は dashboard**
- [ ] Phase 4 — 認証（Supabase クライアント、login/set-password、_authed ガード、招待スクリプト）
- [ ] Phase 5 — 車両 CRUD
- [ ] Phase 6 — 整備記録 CRUD
- [ ] Phase 7 — ダッシュボードと車検アラート
- [ ] Phase 8 — 検証（E2E / レビュー）とデプロイ
- [ ] Phase 9 — docs の HTML 解説ページ
