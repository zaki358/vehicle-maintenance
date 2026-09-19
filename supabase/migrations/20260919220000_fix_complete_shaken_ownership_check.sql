-- 旧実装は「整備記録の挿入 → 車両の所有権チェック」の順だったため、
-- 他人の vehicle_id を渡した場合、所有権チェックの前に複合外部キー
-- (vehicle_id, user_id) 違反で失敗し、Postgres の生の制約違反メッセージが
-- クライアントへそのまま返っていた(内部スキーマ情報の漏洩)。
--
-- 挿入より前に明示的な所有権チェックを行い、失敗時のメッセージを
-- 意図した 'vehicle not found or not owned by current user' に統一する。
-- 権限(security invoker / revoke-grant)は変更していないため再指定不要。
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
declare
  v_record public.maintenance_records;
begin
  if not exists (
    select 1 from public.vehicles
    where id = p_vehicle_id
      and user_id = auth.uid()
  ) then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  insert into public.maintenance_records (
    user_id, vehicle_id, performed_on, work_type, odometer_km, part_detail, note
  ) values (
    auth.uid(), p_vehicle_id, p_performed_on, 'shaken', p_odometer_km, p_part_detail, p_note
  )
  returning * into v_record;

  update public.vehicles
  set shaken_expiry_date = p_new_expiry_date
  where id = p_vehicle_id
    and user_id = auth.uid();

  -- 直前の exists チェックで所有権は確認済みなので通常は必ず1件更新される。
  -- ここに引っかかるのは、チェックと更新の間に対象車両が削除された等の
  -- 競合状態のみ(保険的なチェック)。
  if not found then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  return v_record;
end;
$$;
