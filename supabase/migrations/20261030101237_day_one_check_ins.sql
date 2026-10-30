-- Apply after 001_school_auth.sql and 003_hku_member_email_domains.sql.
-- A check-in records participation and the member's own student declaration;
-- it is not proof of current enrollment, survey submission or group membership.
begin;

create table public.check_in_days (
  day_number integer primary key check (day_number between 1 and 21),
  is_open boolean not null default false
);
alter table public.check_in_days enable row level security;
revoke all on table public.check_in_days from public, anon, authenticated;
grant select on table public.check_in_days to authenticated;
create policy "verified members read check-in availability"
on public.check_in_days for select to authenticated
using ((select private.is_verified_school_user()));

insert into public.check_in_days (day_number, is_open)
select day_number, day_number = 1 from generate_series(1, 21) as days(day_number);

create table public.check_ins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number integer not null references public.check_in_days(day_number),
  checked_in_at timestamptz not null default clock_timestamp(),
  student_confirmed boolean not null check (student_confirmed),
  primary key (user_id, day_number)
);
create index check_ins_day_number_idx on public.check_ins(day_number);
alter table public.check_ins enable row level security;
revoke all on table public.check_ins from public, anon, authenticated;
grant select on table public.check_ins to authenticated;
create policy "verified members read only their check-ins"
on public.check_ins for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_verified_school_user()));

-- The private implementation is the sole client write path. It fixes ownership
-- and time server-side; callers cannot supply either or alter existing records.
create function private.submit_check_in(p_day_number integer, p_student_confirmed boolean)
returns table (day_number integer, checked_in_at timestamptz, student_confirmed boolean)
language plpgsql volatile security definer set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  day_is_open boolean;
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

  -- A retried completed request remains successful even after a day closes.
  return query select c.day_number, c.checked_in_at, c.student_confirmed
    from public.check_ins c where c.user_id = member_id and c.day_number = p_day_number;
  if found then return; end if;

  -- Serialize availability changes against new submissions.
  select d.is_open into day_is_open from public.check_in_days d
    where d.day_number = p_day_number for share;
  if day_is_open is distinct from true then
    raise exception 'check_in_day_closed' using errcode = 'P0001';
  end if;

  insert into public.check_ins(user_id, day_number, checked_in_at, student_confirmed)
    values (member_id, p_day_number, clock_timestamp(), true)
    on conflict on constraint check_ins_pkey do nothing;
  return query select c.day_number, c.checked_in_at, c.student_confirmed
    from public.check_ins c where c.user_id = member_id and c.day_number = p_day_number;
end;
$$;
revoke all on function private.submit_check_in(integer, boolean) from public, anon, authenticated;
grant execute on function private.submit_check_in(integer, boolean) to authenticated;

create function public.submit_check_in(p_day_number integer, p_student_confirmed boolean)
returns table (day_number integer, checked_in_at timestamptz, student_confirmed boolean)
language sql volatile security invoker set search_path = '' as $$
  select * from private.submit_check_in(p_day_number, p_student_confirmed);
$$;
revoke all on function public.submit_check_in(integer, boolean) from public, anon, authenticated;
grant execute on function public.submit_check_in(integer, boolean) to authenticated;

comment on table public.check_in_days is 'Team-controlled availability. Initially only day 1 is open; no automatic schedule.';
comment on table public.check_ins is 'One check-in per verified member per programme day, with server timestamp and self-declared current HKU student eligibility. No browser direct writes or public reads.';
comment on function public.submit_check_in(integer, boolean) is 'Idempotent check-in; accepts only a day number and student self-confirmation. Identity and timestamp are server controlled.';
commit;
