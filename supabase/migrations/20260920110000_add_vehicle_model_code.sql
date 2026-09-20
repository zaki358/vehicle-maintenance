-- 車両に「型式」を追加する。
--
-- 任意入力のため not null + 既定値 '' にしている（null と空文字の2つの「未入力」を
-- 作らないため。note / part_detail など既存の任意テキスト列と同じ方針）。
-- 型式は車種名の補足として一覧・詳細に表示する。

-- 文字数の上限は既存の name / note と同じく Zod（サーバー関数の入口）側で持つ。
-- ここでは構造だけを定義する。

alter table public.vehicles
  add column model_code text not null default '';

comment on column public.vehicles.model_code is '型式（任意）。例: ZC33S';
