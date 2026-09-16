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
  -- maintenance_records から (vehicle_id, user_id) の複合外部キーを張るために必要。
  -- これが無いと「自分の user_id で他人の vehicle_id を指す記録」が RLS を素通りする。
  unique (id, user_id)
);

create index vehicles_user_id_idx on public.vehicles (user_id);

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

alter table public.vehicles enable row level security;

revoke all on public.vehicles from anon;
grant select, insert, update, delete on public.vehicles to authenticated;

create policy "vehicles_select_own"
  on public.vehicles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "vehicles_insert_own"
  on public.vehicles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- with check が無いと、自分の行の user_id を他人の id に書き換えて
-- 行そのものを他人に渡せてしまう(RLS 最頻出のミス)。using と with check の両方が必須。
create policy "vehicles_update_own"
  on public.vehicles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "vehicles_delete_own"
  on public.vehicles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
