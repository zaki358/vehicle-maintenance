-- 整備記録の作業内容を9区分へ入れ替え、区分ごとの入力項目を持てるようにする。
--
-- 旧区分（engine_oil / oil_element / tire / brake_pad / battery / shaken / other）は
-- 「何を交換したか」を区分名そのもので表していたため、部品交換のたびに区分が
-- 増えていく構造だった。新しい9区分は「どういう作業か」で分け、具体的な内容は
-- detail 列に書く。これにより区分を増やさずに任意の整備を記録できる。
--
-- 新区分と、その区分で使う列:
--   engine_oil   エンジンオイル … element_changed（エレメント交換の有無）, oil_type
--   fluid        油脂類交換     … detail（交換箇所。例: ミッション）, oil_type
--   part         部品交換       … detail（交換内容）, part_detail（部品型式）
--   repair       修理           … detail（修理内容）, part_detail（任意）
--   adjust       調整           … detail（調整内容）
--   tuning       チューニング   … detail（内容）, part_detail（任意）
--   modification 改造           … detail（内容）, part_detail（任意）
--   shaken       車検           … （走行距離と備考のみ）
--   other        その他         … detail（作業内容）, part_detail（任意）
--
-- 共通項目は performed_on（作業日）, odometer_km（走行距離）, note（備考）。
--
-- 既存データは依頼者の判断で全削除する。旧区分から新区分への対応付けは
-- 情報の欠落（例: tire → part だが「何を交換したか」の文言が無い）を伴うため、
-- 入れ直す方を選んだ。

-- 1. 既存の整備記録を削除する
delete from public.maintenance_records;

-- 2. 旧 CHECK 制約を外す
--    インラインで書いた CHECK の制約名は Postgres の自動採番に依存する
--    （maintenance_records_check / maintenance_records_check1 など）。
--    名前を決め打ちすると環境によって落ちるため、work_type に言及している
--    CHECK 制約を定義文から探して外す。
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

-- 3. 列の入れ替え
alter table public.maintenance_records
  drop column work_type_other;

alter table public.maintenance_records
  add column detail text not null default '',
  add column oil_type text not null default '',
  add column element_changed boolean not null default false;

comment on column public.maintenance_records.detail is '作業の内容。交換内容/修理内容/調整内容/油脂の交換箇所など、区分ごとに意味が変わる';
comment on column public.maintenance_records.oil_type is '油種。engine_oil と fluid でのみ使う（任意）';
comment on column public.maintenance_records.element_changed is 'オイルエレメントを同時交換したか。engine_oil でのみ使う';

-- 4. 新しい区分の CHECK
alter table public.maintenance_records
  add constraint maintenance_records_work_type_check check (
    work_type in (
      'engine_oil',
      'fluid',
      'part',
      'repair',
      'adjust',
      'tuning',
      'modification',
      'shaken',
      'other'
    )
  );

-- 5. 区分ごとの必須項目
--    「何をしたか」が空のまま残ると後から読めない記録になるため、
--    detail を必要とする区分では DB 側でも空文字を弾く。
--    エンジンオイル・車検は区分名自体が作業内容を表すので detail を要求しない。
alter table public.maintenance_records
  add constraint maintenance_records_detail_required check (
    work_type not in ('fluid', 'part', 'repair', 'adjust', 'tuning', 'modification', 'other')
    or char_length(detail) > 0
  );

--    部品交換は「どの部品か」が記録の核なので部品型式を必須にする。
--    修理・チューニング・改造・その他では任意（部品を伴わない作業もあるため）。
alter table public.maintenance_records
  add constraint maintenance_records_part_detail_required check (
    work_type <> 'part' or char_length(part_detail) > 0
  );
