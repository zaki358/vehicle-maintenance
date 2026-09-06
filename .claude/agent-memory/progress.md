# 進捗記録 — vehicle-maintenance

> **セッション開始時、まずこのファイルを読むこと。**
> 実装プラン全文: `C:\Users\barub\.claude\plans\tanstack-star-goofy-quill.md`

最終更新: 2026-09-06（Phase 1 ほぼ完了・最初のソースファイル完成）

---

## 現在地

**Phase 1 — 骨組み** がほぼ完了。テスト基盤が動き、最初のソースファイル
`src/lib/date/date-string.ts` が TDD で完成（34 テスト・カバレッジ 100%）。
残るは専用サブエージェントの作成のみ。

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
      `isOnOrAfter` / `isOnOrBefore`。**34 テスト・カバレッジ 100%（stmt/branch/func/line すべて）**
- [x] **解説ドキュメント生成** — `docs/src/lib/date/date-string.html`（共有CSS `docs/assets/doc-style.css` も初回作成）

---

## 次にやること

1. **プロジェクト専用サブエージェントを `.claude/agents/` に作る**（Phase 1 の最後の項目）
   このプロジェクト固有の観点を組み込む: 日本語UI / モバイルファースト / 車検ドメイン /
   JST・UTC 問題 / サーバー用 Supabase クライアントのメモ化禁止 / RLS の WITH CHECK
2. **Phase 3 の純粋ロジックを続ける**（Supabase 待ちの間に進められる）
   次の順序: `lib/date/jst.ts`（todayInJst）→ `lib/date/add-months.ts` →
   `features/shaken/lib/{days-remaining,alert-tier,renewal,messages}.ts`
   ※ 各ファイル完成ごとに `generate-code-docs` を呼ぶこと
3. **Phase 2（DB とマイグレーション）** — **依頼者の Supabase プロジェクト作成待ち**

## 未コミット

Git にはまだ 1 度もコミットしていない（`master` ブランチ、コミット履歴ゼロ）。
依頼者に確認してから初回コミットを行うこと。

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
- [~] Phase 3 — 純粋ロジック（TDD）`lib/date/*`, `features/*/lib/*` ← **date-string.ts 完成、ここを先に進める**
- [ ] Phase 4 — 認証（Supabase クライアント、login/set-password、_authed ガード、招待スクリプト）
- [ ] Phase 5 — 車両 CRUD
- [ ] Phase 6 — 整備記録 CRUD
- [ ] Phase 7 — ダッシュボードと車検アラート
- [ ] Phase 8 — 検証（E2E / レビュー）とデプロイ
- [ ] Phase 9 — docs の HTML 解説ページ
