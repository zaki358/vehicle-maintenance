# supabase/migrations — Phase 2: DB とマイグレーション

*supabase/migrations/\*.sql（4ファイル）*

## 概要

このアプリのデータベース本体を作る4本のマイグレーション（DDL）をまとめて解説する。車両（`vehicles`）と整備記録（`maintenance_records`）の2テーブル、それぞれの Row Level Security（RLS）ポリシー、そして車検完了処理をアトミックに行う RPC 関数 `complete_shaken` から成る。

「データ共有は完全に個人ごと」という要件を守るのが目的で、 **RLS（行レベル）・複合外部キー（組み合わせレベル）・CHECK制約（値レベル）・トランザクション関数（操作の原子性）** という4段構えで「自分のデータしか触れない」「中途半端な状態にならない」を保証する設計になっている。

## 構成

| ファイル | 種別 | 説明 |
| --- | --- | --- |
| `20260907230000_create_set_updated_at_function.sql` | function | `updated_at` 列を自動更新する共通トリガー関数 |
| `20260907230100_create_vehicles.sql` | table + RLS | 車両テーブル。RLS 4ポリシー（select/insert/update/delete） |
| `20260907230200_create_maintenance_records.sql` | table + RLS | 整備記録テーブル。複合外部キーと RLS 4ポリシー |
| `20260907230300_create_complete_shaken_function.sql` | function (RPC) | 車検完了処理（記録追加＋満了日更新）をアトミックに行う |
| `20260919220000_fix_complete_shaken_ownership_check.sql` | function (RPC・再定義) | Phase 8: `complete_shaken` の所有権チェック順序を修正 |

## コード解説

### 1. set\_updated\_at() — 更新日時を自動で記録する関数

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

「トリガー関数」と呼ばれる特殊な関数。テーブルの行が `UPDATE` されるたびに自動的に呼び出され、その行の `updated_at` 列に現在時刻（`now()`）をセットする。`new` は「更新後の行の内容」を指す plpgsql の特殊変数。

`vehicles` にも `maintenance_records` にも使う共通部品なので、両テーブルより先に作っている。「いつ更新したか」をアプリ側で毎回手入力する必要がなくなり、書き忘れも起きない。

### 2. vehicles テーブル

```sql
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  vehicle_type text not null check (vehicle_type in ('car', 'motorcycle')),
  shaken_expiry_date date,
  note text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
```

`id` — この車両を一意に識別するID。`gen_random_uuid()` で自動採番される。

`user_id` — 持ち主のID。`default auth.uid()` により、INSERT時に指定しなくても今ログインしている人のIDが自動で入る。 `references auth.users(id) on delete cascade` は「Supabase Auth のユーザーテーブルを参照し、そのユーザーが削除されたら車両も一緒に消す」という意味。

`vehicle_type` — `check` 制約で `'car'` か `'motorcycle'` 以外の値を拒否する。DBレベルでの型安全（アプリの Zod スキーマとの二重チェック）。

`shaken_expiry_date` — 車検満了日。`not null` が付いていない、つまり NULL 許容（250cc 以下のバイクなど車検不要な車両のため）。

`note` — 備考。`not null default ''` で「未入力なら空文字」を保証し、 NULL チェックの手間を減らしている。

`archived_at` — アーカイブ（論理削除）した日時。NULL なら現役の車両。

`unique (id, user_id)` — `id` だけなら既に primary key でユニークだが、あえて `(id, user_id)` の組み合わせでもユニーク制約を張っている。これ単体では意味が薄いが、**次の maintenance\_records から複合外部キーを張るための土台**になる。

```sql
create index vehicles_user_id_idx on public.vehicles (user_id);

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();
```

インデックス — 「自分の車両だけ検索する」というクエリ（`where user_id = ...`）が頻繁に発生するので、その列に検索用の索引を作って高速化する。

トリガー — このテーブルで `UPDATE` が起きる直前（`before update`）に、先ほどの `set_updated_at()` 関数を呼び出す設定。

```sql
alter table public.vehicles enable row level security;

revoke all on public.vehicles from anon;
grant select, insert, update, delete on public.vehicles to authenticated;
```

`enable row level security` — このテーブルに行単位のアクセス制御を有効化する。

`revoke all ... from anon` — 未ログインの人からは一切のアクセス権を剥奪する。

`grant ... to authenticated` — ログイン済みの人には読み書きの権限自体は与える（ただし「どの行に」まではこの後のポリシーが決める）。

```sql
create policy "vehicles_select_own"
  on public.vehicles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
```

SELECT（閲覧）するときは、`auth.uid()`（今ログインしている人のID）と、その行の `user_id` が一致する行だけを見せる、というルール。 `(select auth.uid())` とサブクエリの形で包んでいるのは、PostgreSQL が実行計画をキャッシュして高速化できるようにするための書き方。

```sql
create policy "vehicles_insert_own"
  on public.vehicles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
```

INSERT（新規作成）時は「作ろうとしている行の `user_id` が自分のIDと一致しているか」を `with check` でチェックする。

```sql
create policy "vehicles_update_own"
  on public.vehicles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

UPDATE（更新）だけ `using` と `with check` の両方がある。 `using` は「更新しようとしている**元の行**が自分のものか」、 `with check` は「更新**した後の行**も自分のものか」を見る。 `with check` が無いと、自分の行の `user_id` 列を他人のIDに書き換えて、その行を他人に譲渡できてしまう（RLS 最頻出のミス）。

```sql
create policy "vehicles_delete_own"
  on public.vehicles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

DELETE（削除）は「自分の行かどうか」だけ見ればよいので `using` だけでよい。

### 3. maintenance\_records テーブル

基本構造は `vehicles` とほぼ同じ考え方の繰り返しだが、2点だけ新しい要素がある。

```sql
foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade,
```

これが**複合外部キー**。単に `vehicle_id` だけを外部キーにすると、「自分の `user_id` ＋ 他人の `vehicle_id`」という組み合わせの記録を作れてしまう（RLS は行の `user_id` しか見ないため、これ自体は自分のものとして通ってしまう）。`(vehicle_id, user_id)` のペアで `vehicles` テーブルの `(id, user_id)`（先ほど作った unique 制約）を参照させることで、「その `vehicle_id` と `user_id` の組み合わせが実際に存在するか」を DB が強制的にチェックする。他人の車両IDを指定した瞬間、外部キー違反で INSERT 自体が失敗する。

```sql
check (work_type <> 'other' or char_length(work_type_other) > 0)
```

「`work_type` が `'other'`（その他）でない、**または** `work_type_other`（自由入力欄）に1文字以上入っている」という制約。つまり「その他を選んだのに自由入力が空」というデータを、DBレベルでも拒否する（アプリ側の Zod スキーマ `record-schema.ts` と同じルールを、最後の砦として DB にも入れている二重チェック）。

以降のインデックス・トリガー・RLS・ポリシーは `vehicles` と全く同じ考え方のため省略する（`maintenance_records_select_own` など4ポリシー、すべて `user_id` 基準）。

### 4. complete\_shaken() — 車検完了処理をまとめて行う関数

```sql
create or replace function public.complete_shaken(
  p_vehicle_id uuid,
  p_performed_on date,
  p_new_expiry_date date,
  p_odometer_km integer default null,
  p_part_detail text default '',
  p_note text default ''
)
returns public.maintenance_records
language plpgsql
security invoker
set search_path = public
as $$
```

車検を完了したときは、①「車検を実施した」という整備記録を1件追加する、 ②車両の `shaken_expiry_date`（満了日）を新しい日付に更新する、という **2つの書き込み**が必要。これを画面から2回に分けてリクエストすると、 1回目が成功して2回目が失敗した場合に「記録は増えたのに満了日は古いまま」という中途半端な状態が起こり得る。それを防ぐため、2つの書き込みを1つの関数にまとめ、 `.rpc()` という仕組みで1回のトランザクションとして呼び出す。

`security invoker` が重要な指定で、「この関数を呼んだ人自身の権限で実行する」という意味。もし `security definer`（関数の作成者の権限で実行）にしてしまうと、RLS を迂回して他人のデータを触れる強力な関数になってしまう。 `security invoker` にしておくことで、この関数の中の `insert` や `update` にも、`vehicles`・`maintenance_records` の RLS ポリシーがそのまま適用され続ける。

```sql
declare
  v_record public.maintenance_records;
begin
  insert into public.maintenance_records (
    user_id, vehicle_id, performed_on, work_type, odometer_km, part_detail, note
  ) values (
    auth.uid(), p_vehicle_id, p_performed_on, 'shaken', p_odometer_km, p_part_detail, p_note
  )
  returning * into v_record;
```

まず整備記録を1件挿入する。`work_type` は `'shaken'` 固定。 `returning * into v_record` で、挿入した行の内容を後で返せるように変数に保存している。

```sql
  update public.vehicles
  set shaken_expiry_date = p_new_expiry_date
  where id = p_vehicle_id
    and user_id = auth.uid();

  if not found then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  return v_record;
end;
$$;
```

続いて車両の満了日を更新する。

`if not found` は「直前の UPDATE が0件しか更新しなかった場合」を検知する仕組みで、該当する車両が見つからなかった（＝他人の車両IDを渡された等）ときは例外を発生させる。関数内で例外が起きると、直前の `insert` も含めて **すべて自動的に取り消される**（PostgreSQL の関数は1つのトランザクションとして扱われるため）。これにより「記録だけ追加されて満了日が更新されない」という中途半端な状態を防いでいる。

```sql
revoke all on function public.complete_shaken(uuid, date, date, integer, text, text) from anon, public;
grant execute on function public.complete_shaken(uuid, date, date, integer, text, text) to authenticated;
```

この関数を実行できるのはログイン済みユーザーだけ、と権限を絞っている（PostgreSQL は関数を作ると初期状態で全ロールに実行権限が付くため、明示的に絞り込む必要がある）。

### 5. Phase 8: complete\_shaken の所有権チェック順序修正

Phase 8のコードレビューで、上記4.の実装には抜け穴ではなく **情報漏洩**の問題があると指摘された。`p_vehicle_id` に他人の車両IDを渡した場合、実際に拒否はされる（複合外部キーが機能するためセキュリティ上は安全）が、拒否されるタイミングが「所有権チェック（`update ... if not found`）」より**前**の `insert` の時点になってしまい、意図した `'vehicle not found or not owned by current user'` ではなく、 Postgres が生成する複合外部キー違反の生メッセージ（テーブル名・制約名などの内部スキーマ情報を含む）がそのままクライアントへ返っていた。

```sql
create or replace function public.complete_shaken(...)
...
begin
  if not exists (
    select 1 from public.vehicles
    where id = p_vehicle_id
      and user_id = auth.uid()
  ) then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  insert into public.maintenance_records (...) values (...) returning * into v_record;

  update public.vehicles
  set shaken_expiry_date = p_new_expiry_date
  where id = p_vehicle_id
    and user_id = auth.uid();

  if not found then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  return v_record;
end;
$$;
```

`insert` より**前**に `select 1 from vehicles where id = ... and user_id = auth.uid()` という明示的な所有権チェックを追加した。他人の車両IDを渡した場合は、この時点で意図したエラーメッセージで拒否されるため、複合外部キー違反という内部実装の詳細がクライアントに漏れることがなくなる。

末尾の `update ... if not found` チェックはあえて残してある。直前の `exists` チェックと `update` の間に（理論上）対象車両が別トランザクションで削除される競合状態が起こりえるため、その場合に備えた保険的な二重チェックとして機能する。

`security invoker`・権限（`revoke`/`grant`）・関数シグネチャはいずれも変更していないため、再指定は不要（`create or replace function` は既存の権限設定をそのまま維持する）。

このマイグレーションは開発用・本番用の両Supabaseプロジェクトへ、これまでと同じ「SQL Editorへの手動貼り付け」方式で適用する必要がある（`.claude/agent-memory/progress.md`の「判断の記録」参照）。

## 追加マイグレーション（2026-09-20）— 型式の追加と作業内容の作り直し

車両に「型式」を足し、整備記録の作業内容を9区分へ入れ替える2本を追加した。前者は単純な列追加だが、後者はテーブルの列構成と CHECK 制約を作り替える破壊的な変更を含む。

| ファイル | 種別 | 説明 |
| --- | --- | --- |
| `20260920110000_add_vehicle_model_code.sql` | alter table | `vehicles` に `model_code`（型式）を追加 |
| `20260920110100_rework_maintenance_work_types.sql` | alter table / delete | 作業内容を9区分へ入れ替え、区分ごとの入力列と CHECK 制約を張り直す |

### 6. 20260920110000\_add\_vehicle\_model\_code.sql — 車両に型式を追加

```sql
alter table public.vehicles
  add column model_code text not null default '';

comment on column public.vehicles.model_code is '型式（任意）。例: ZC33S';
```

車種名だけでは同名の別グレードを区別しづらいため、補足として型式を持たせる。一覧・詳細で車種名に添えて表示する。

**`nullable` ではなく `not null default ''` にしている** のが判断点。任意入力の列を `nullable` にすると、「`null`」と「空文字」という2つの「未入力」が生まれ、表示・比較・検索のたびに両方を考慮しなければならなくなる。既存の任意テキスト列（`note`、 `part_detail`）と同じく空文字に一本化した。 Zod 側（`vehicle-schema.ts`）の `modelCode` も `.default('')` で揃えてある。

`default ''` を付けているため、既存行はすべて空文字で埋まり、 `not null` 制約と両立する。データ移行のコードは要らない。

文字数の上限（50文字）はここに書かず、サーバー関数の入口の Zod が持つ。既存の `name` / `note` と同じ「長さの上限はアプリの入力ポリシー、構造は DB」という役割分担。

### 7. 20260920110100\_rework\_maintenance\_work\_types.sql — 作業内容を9区分へ

旧区分（`engine_oil` / `oil_element` / `tire` / `brake_pad` / `battery` / `shaken` / `other`）は「**何を交換したか**」を区分名そのもので表していた。この形は部品が増えるたびに区分を増やす必要があり、区分に収まらないものを受けるための自由入力列 `work_type_other` も抱えていた。新しい9区分は「**どういう作業か**」で分け、具体的な内容は `detail` 列に書く。これで区分を増やさずに任意の整備を記録できる。

| 区分 | 意味 | その区分で使う列 |
| --- | --- | --- |
| `engine_oil` | エンジンオイル | `oil_type`, `element_changed` |
| `fluid` | 油脂類交換 | `detail`（交換箇所。例: ミッション）, `oil_type` |
| `part` | 部品交換 | `detail`（交換内容）, `part_detail`（部品型式・必須） |
| `repair` | 修理 | `detail`（修理内容）, `part_detail`（任意） |
| `adjust` | 調整 | `detail`（調整内容） |
| `tuning` | チューニング | `detail`（内容）, `part_detail`（任意） |
| `modification` | 改造 | `detail`（内容）, `part_detail`（任意） |
| `shaken` | 車検 | （走行距離と備考のみ） |
| `other` | その他 | `detail`（作業内容）, `part_detail`（任意） |

共通項目は `performed_on`（作業日）・`odometer_km`（走行距離）・ `note`（備考）。この表は `lib/work-types.ts` の `workTypeFields()` が返す構成とそのまま対応しており、画面・Zod・DB の3層が同じルールを持つ。

```sql
-- 1. 既存の整備記録を削除する
delete from public.maintenance_records;
```

**既存データは依頼者の判断で全削除する。** 旧区分から新区分への対応付けは情報の欠落を伴うため（例: `tire` は `part` に移せるが、「何を交換したか」を書くべき `detail` に入れる文言がどこにも無い）、機械的に変換するより入れ直す方を選んだ。運用開始前のため実害が小さい、という前提での判断。

```sql
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'maintenance_records'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%work_type%'
  loop
    execute format('alter table public.maintenance_records drop constraint %I', constraint_name);
  end loop;
end $$;
```

旧 CHECK 制約の削除。**制約名を決め打ちしていない**のが要点で、テーブル作成時にインラインで書いた CHECK は Postgres が名前を自動採番する（`maintenance_records_check`、`maintenance_records_check1` など、書いた順で番号が変わる）。名前を直接指定すると、適用する環境（開発用・本番用の各 Supabase プロジェクト）で採番がずれたときにマイグレーションが落ちる。

そこで `pg_constraint` を引き、定義文（`pg_get_constraintdef`）に `work_type` が現れる CHECK 制約をすべて探して外す。`contype = 'c'` で CHECK に限定し、 `format(... %I)` で識別子として安全にクォートしている。該当が0件でもループが回らないだけでエラーにならないため、何度実行しても安全（冪等）。

```sql
alter table public.maintenance_records
  drop column work_type_other;

alter table public.maintenance_records
  add column detail text not null default '',
  add column oil_type text not null default '',
  add column element_changed boolean not null default false;

comment on column public.maintenance_records.detail is '作業の内容。交換内容/修理内容/調整内容/油脂の交換箇所など、区分ごとに意味が変わる';
comment on column public.maintenance_records.oil_type is '油種。engine_oil と fluid でのみ使う（任意）';
comment on column public.maintenance_records.element_changed is 'オイルエレメントを同時交換したか。engine_oil でのみ使う';
```

列の入れ替え。旧「その他」の自由入力だった `work_type_other` を落とし、 `detail`・`oil_type`・`element_changed` を足す。テキスト列はいずれも `not null default ''` で、 `model_code` と同じく「未入力＝空文字」に統一している。

`detail` は**区分によって意味が変わる**列で、画面上の見出しも「交換箇所 / 交換内容 / 修理内容 / 調整内容 / チューニング内容 / 改造内容 / 作業内容」と切り替わる。列コメントにその旨を明記しているのは、SQL Editor から直接テーブルを見た人が意味を取り違えないようにするため。

`oil_type` と `element_changed` は特定の区分でしか使わないが、別テーブルには分けず同じ行に持たせている。区分ごとにテーブルを分けると一覧の取得が複雑になる割に、列数はこの程度で収まるため。使わない区分で値が入らないことは、Zod の `transform` （`record-schema.ts`）が保存前に空へ戻すことで担保する。

```sql
alter table public.maintenance_records
  add constraint maintenance_records_work_type_check check (
    work_type in (
      'engine_oil', 'fluid', 'part', 'repair', 'adjust',
      'tuning', 'modification', 'shaken', 'other'
    )
  );
```

新しい区分の CHECK。今回は**明示的に名前を付けている** （`maintenance_records_work_type_check`）。前述の自動採番問題を繰り返さないためで、次にこの制約を差し替えるときは名前で確実に落とせる。

列挙型（`create type ... as enum`）ではなく CHECK を使うのは、値の追加・削除が `alter table` だけで済み、 Zod 側の `WORK_TYPES` と対応関係を読み取りやすいため。

```sql
alter table public.maintenance_records
  add constraint maintenance_records_detail_required check (
    work_type not in ('fluid', 'part', 'repair', 'adjust', 'tuning', 'modification', 'other')
    or char_length(detail) > 0
  );

alter table public.maintenance_records
  add constraint maintenance_records_part_detail_required check (
    work_type <> 'part' or char_length(part_detail) > 0
  );
```

**区分ごとの必須項目を DB 側でも強制する。** 「何をしたか」が空のまま残ると、後から読んで意味の取れない記録になる。そのため `detail` を必要とする7区分では空文字を弾く。 `engine_oil` と `shaken` を除外しているのは、この2つは区分名自体が作業内容を表しており `detail` を要求する意味がないため。

部品型式は `part`（部品交換）でのみ必須。部品交換は「どの部品を入れたか」が記録の核だから。修理・チューニング・改造・その他では部品を伴わない作業もありうるので任意にしている。

`A or B` の形で「その区分でなければ無条件に通す」と書くのは、区分ごとの条件付き必須を CHECK で表す定石。`char_length(...) > 0` を使うのは、列が `not null` なので `null` 判定ではなく空文字判定が必要なため。

この2つの制約は `workTypeFields()` の `required` 指定と同じ内容で、画面・Zod・DB の3層で同じルールを守る。どこを迂回されても不正な行は入らない。

この2本も、これまでと同じく開発用・本番用の両 Supabase プロジェクトへ「SQL Editor への手動貼り付け」方式で適用する必要がある（`.claude/agent-memory/progress.md` の「判断の記録」参照）。 **`delete from public.maintenance_records` を含むため、適用先のプロジェクトを取り違えないこと。**

---

*生成日: 2026-09-19（Phase 8で5.の修正を追記、2026-09-20に6.・7.を追記） ／ 対象ファイル: supabase/migrations/20260907230000\_create\_set\_updated\_at\_function.sql, supabase/migrations/20260907230100\_create\_vehicles.sql, supabase/migrations/20260907230200\_create\_maintenance\_records.sql, supabase/migrations/20260907230300\_create\_complete\_shaken\_function.sql, supabase/migrations/20260919220000\_fix\_complete\_shaken\_ownership\_check.sql, supabase/migrations/20260920110000\_add\_vehicle\_model\_code.sql, supabase/migrations/20260920110100\_rework\_maintenance\_work\_types.sql*
