alter table booth_private.entry_grants
  add column is_session boolean not null default false;

-- Keep grants issued by older booth pages single-use.
create or replace function booth_private.redeem_entry(p_token uuid) returns uuid
language sql security definer set search_path = '' as $$
  delete from booth_private.entry_grants
  where token = p_token and not is_session and expires_at > now()
  returning gen_random_uuid();
$$;

create function booth_private.open_entry_session(p_password text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  grant_token uuid := booth_private.unlock_entry(p_password);
  opened jsonb;
begin
  if grant_token is null then return null; end if;
  update booth_private.entry_grants
  set token = gen_random_uuid(), is_session = true, expires_at = now() + interval '8 hours'
  where token = grant_token
  returning jsonb_build_object('token', token, 'expiresAt', expires_at) into opened;
  return opened;
end;
$$;

create function booth_private.new_entry_attempt(p_token uuid) returns uuid
language sql security definer set search_path = '' as $$
  select gen_random_uuid()
  from booth_private.entry_grants
  where token = p_token and is_session and expires_at > now();
$$;

create function public.booth_entry_open_session(p_password text) returns jsonb
language sql security invoker set search_path = '' as $$
  select booth_private.open_entry_session(p_password);
$$;

create function public.booth_entry_session_attempt(p_token uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select booth_private.new_entry_attempt(p_token);
$$;

revoke all on function booth_private.open_entry_session(text), booth_private.new_entry_attempt(uuid),
  public.booth_entry_open_session(text), public.booth_entry_session_attempt(uuid) from public;
grant execute on function booth_private.open_entry_session(text), booth_private.new_entry_attempt(uuid),
  public.booth_entry_open_session(text), public.booth_entry_session_attempt(uuid) to anon, authenticated;
