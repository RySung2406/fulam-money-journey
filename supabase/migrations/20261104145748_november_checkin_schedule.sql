-- Availability is calculated server-side in Hong Kong time. Past days remain
-- available for make-up check-ins during the daily 06:00–23:59 window.
begin;
create function public.get_check_in_schedule()
returns table(day_number integer, is_open boolean)
language sql stable security invoker set search_path = '' as $$
  select d.day_number,
    (local_now::date between date '2026-11-08' and date '2026-11-28'
     and local_now::time >= time '06:00'
     and local_now::date >= date '2026-11-08' + (d.day_number - 1))
  from public.check_in_days d
  cross join (select statement_timestamp() at time zone 'Asia/Hong_Kong' as local_now) t
  order by d.day_number;
$$;
revoke all on function public.get_check_in_schedule() from public, anon, authenticated;
grant execute on function public.get_check_in_schedule() to authenticated;

create or replace function private.submit_check_in(p_day_number integer, p_student_confirmed boolean)
returns table (day_number integer, checked_in_at timestamptz, student_confirmed boolean)
language plpgsql volatile security definer set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  local_now timestamp := clock_timestamp() at time zone 'Asia/Hong_Kong';
begin
  if member_id is null or not private.is_verified_school_user() then
    raise exception 'check_in_auth_required' using errcode = '42501';
  end if;
  if p_student_confirmed is distinct from true then
    raise exception 'check_in_student_confirmation_required' using errcode = '42501';
  end if;
  if p_day_number is null or p_day_number < 1 or p_day_number > 21 then
    raise exception 'check_in_day_invalid' using errcode = '22023';
  end if;
  return query select c.day_number, c.checked_in_at, c.student_confirmed
    from public.check_ins c where c.user_id = member_id and c.day_number = p_day_number;
  if found then return; end if;
  if local_now::date not between date '2026-11-08' and date '2026-11-28'
     or local_now::time < time '06:00'
     or local_now::date < date '2026-11-08' + (p_day_number - 1) then
    raise exception 'check_in_day_closed' using errcode = 'P0001';
  end if;
  insert into public.check_ins(user_id, day_number, checked_in_at, student_confirmed)
    values (member_id, p_day_number, clock_timestamp(), true)
    on conflict on constraint check_ins_pkey do nothing;
  return query select c.day_number, c.checked_in_at, c.student_confirmed
    from public.check_ins c where c.user_id = member_id and c.day_number = p_day_number;
end;
$$;
commit;
