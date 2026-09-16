-- 車検完了は「整備記録の挿入」と「車両の満了日更新」の 2 テーブル書き込みからなる。
-- PostgREST の単発リクエストはテーブルを跨いだトランザクションを組めないため、
-- 関数にまとめて .rpc() で 1 回のトランザクションとして呼び、
-- 「記録だけ増えて満了日が更新されない」といった半端な状態を防ぐ。
--
-- security invoker のため、呼び出したユーザーの権限で実行される
-- (= 上記の RLS ポリシーがそのまま適用され、他人の車両は操作できない)。
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

  if not found then
    raise exception 'vehicle not found or not owned by current user';
  end if;

  return v_record;
end;
$$;

revoke all on function public.complete_shaken(uuid, date, date, integer, text, text) from anon, public;
grant execute on function public.complete_shaken(uuid, date, date, integer, text, text) to authenticated;
