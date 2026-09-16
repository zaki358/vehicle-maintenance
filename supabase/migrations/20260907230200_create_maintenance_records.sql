create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id uuid not null,
  performed_on date not null,
  work_type text not null check (
    work_type in ('engine_oil', 'oil_element', 'tire', 'brake_pad', 'battery', 'shaken', 'other')
  ),
  work_type_other text not null default '',
  odometer_km integer check (odometer_km is null or odometer_km >= 0),
  part_detail text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- vehicles(id, user_id) の複合ユニーク制約を参照する複合外部キー。
  -- 「自分の user_id ＋ 他人の vehicle_id」の組み合わせを DB レベルで拒否する。
  -- RLS は行の user_id しか見ないため、この整合性チェックは RLS だけでは代替できない。
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade,
  check (work_type <> 'other' or char_length(work_type_other) > 0)
);

create index maintenance_records_vehicle_id_idx on public.maintenance_records (vehicle_id);
create index maintenance_records_user_id_idx on public.maintenance_records (user_id);

create trigger maintenance_records_set_updated_at
  before update on public.maintenance_records
  for each row
  execute function public.set_updated_at();

alter table public.maintenance_records enable row level security;

revoke all on public.maintenance_records from anon;
grant select, insert, update, delete on public.maintenance_records to authenticated;

create policy "maintenance_records_select_own"
  on public.maintenance_records
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "maintenance_records_insert_own"
  on public.maintenance_records
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "maintenance_records_update_own"
  on public.maintenance_records
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "maintenance_records_delete_own"
  on public.maintenance_records
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
