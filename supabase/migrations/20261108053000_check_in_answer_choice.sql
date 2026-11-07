-- Members choose A, B or C when they check in. The first saved choice stays.
-- The two-argument function remains so the previous website can still check in.
begin;

alter table public.check_ins add column choice text;
alter table public.check_ins drop constraint if exists check_ins_choice_check;
alter table public.check_ins add constraint check_ins_choice_check check (choice in ('A', 'B', 'C'));

create function private.submit_check_in(p_day_number integer, p_student_confirmed boolean, p_choice text)
returns table (day_number integer, checked_in_at timestamptz, student_confirmed boolean, choice text)
language plpgsql volatile security definer set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  local_now timestamp := clock_timestamp() at time zone 'Asia/Hong_Kong';
  opens_at timestamp := case
    when p_day_number = 1 then timestamp '2026-11-08 00:00:00'
    else (date '2026-11-08' + (p_day_number - 1)) + time '06:00'
  end;
  existing_choice text;
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
  if p_choice is null or p_choice not in ('A', 'B', 'C') then
    raise exception 'check_in_choice_invalid' using errcode = '22023';
  end if;

  select c.choice into existing_choice
    from public.check_ins c
    where c.user_id = member_id and c.day_number = p_day_number;
  if found then
    if existing_choice is null then
      update public.check_ins
        set choice = p_choice
        where user_id = member_id and day_number = p_day_number and choice is null;
    end if;
    return query select c.day_number, c.checked_in_at, c.student_confirmed, c.choice
      from public.check_ins c
      where c.user_id = member_id and c.day_number = p_day_number;
    return;
  end if;

  if local_now < opens_at or local_now >= timestamp '2026-11-29 00:00:00' then
    raise exception 'check_in_day_closed' using errcode = 'P0001';
  end if;

  insert into public.check_ins(user_id, day_number, checked_in_at, student_confirmed, choice)
    values (member_id, p_day_number, clock_timestamp(), true, p_choice)
    on conflict on constraint check_ins_pkey do nothing;

  return query select c.day_number, c.checked_in_at, c.student_confirmed, c.choice
    from public.check_ins c
    where c.user_id = member_id and c.day_number = p_day_number;
end;
$$;

revoke all on function private.submit_check_in(integer, boolean, text) from public, anon, authenticated;
grant execute on function private.submit_check_in(integer, boolean, text) to authenticated;

create function public.submit_check_in(p_day_number integer, p_student_confirmed boolean, p_choice text)
returns table (day_number integer, checked_in_at timestamptz, student_confirmed boolean, choice text)
language sql volatile security invoker set search_path = '' as $$
  select * from private.submit_check_in(p_day_number, p_student_confirmed, p_choice);
$$;

revoke all on function public.submit_check_in(integer, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_check_in(integer, boolean, text) to authenticated;

comment on function public.submit_check_in(integer, boolean, text) is
  'Idempotent check-in with answer A, B or C. The first saved answer is kept. Identity and timestamp are server controlled.';

commit;
