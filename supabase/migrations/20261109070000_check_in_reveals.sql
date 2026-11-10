-- Correct answers are not part of the public website. A verified member receives a
-- day's explanation only after saving A, B or C. Day 1 is available immediately
-- after that. Every later day waits until 06:00 Hong Kong time the next morning.
-- The answer rows themselves are withheld from this public repository.
begin;

create table private.check_in_answers (
  day_number integer primary key references public.check_in_days(day_number),
  letter text not null check (letter in ('A', 'B', 'C')),
  nick text not null check (length(btrim(nick)) > 0),
  exp_zh text not null check (length(btrim(exp_zh)) > 0),
  exp_en text not null check (length(btrim(exp_en)) > 0),
  src_zh text not null check (length(btrim(src_zh)) > 0),
  src_en text not null check (length(btrim(src_en)) > 0),
  src_url text not null check (src_url ~ '^https://[^[:space:]]+$'),
  take_zh text not null check (length(btrim(take_zh)) > 0),
  take_en text not null check (length(btrim(take_en)) > 0)
);

alter table private.check_in_answers enable row level security;
revoke all on table private.check_in_answers from public, anon, authenticated;

create function private.get_check_in_reveals()
returns table (
  day_number integer,
  letter text,
  nick text,
  exp_zh text,
  exp_en text,
  src_zh text,
  src_en text,
  src_url text,
  take_zh text,
  take_en text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  member_id uuid := auth.uid();
  local_now timestamp := statement_timestamp() at time zone 'Asia/Hong_Kong';
begin
  if member_id is null or not private.is_verified_school_user() then
    raise exception 'check_in_auth_required' using errcode = '42501';
  end if;
  return query
  select a.day_number, a.letter, a.nick, a.exp_zh, a.exp_en, a.src_zh, a.src_en, a.src_url, a.take_zh, a.take_en
  from private.check_in_answers a
  join public.check_ins c
    on c.day_number = a.day_number
   and c.user_id = member_id
   and c.choice in ('A', 'B', 'C')
  where a.day_number = 1
     or local_now >= (date '2026-11-08' + a.day_number) + time '06:00'
  order by a.day_number;
end;
$$;

revoke all on function private.get_check_in_reveals() from public, anon, authenticated;
grant execute on function private.get_check_in_reveals() to authenticated;

create function public.get_check_in_reveals()
returns table (
  day_number integer,
  letter text,
  nick text,
  exp_zh text,
  exp_en text,
  src_zh text,
  src_en text,
  src_url text,
  take_zh text,
  take_en text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_check_in_reveals();
$$;

revoke all on function public.get_check_in_reveals() from public, anon, authenticated;
grant execute on function public.get_check_in_reveals() to authenticated;

comment on table private.check_in_answers is
  'Correct choice and explanation for each programme day. API roles cannot read this table.';

comment on function public.get_check_in_reveals() is
  'Returns explanations for days this member has answered. Day 1 is immediate. Later days open at 06:00 Hong Kong time the next morning.';

notify pgrst, 'reload schema';

commit;
