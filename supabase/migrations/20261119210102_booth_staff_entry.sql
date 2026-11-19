-- Provision the salted password hash separately using an administrative connection.
create schema booth_private;
revoke all on schema booth_private from public;
grant usage on schema booth_private to anon, authenticated;

create table booth_private.entry_password (
  singleton boolean primary key default true check (singleton),
  password_hash text not null,
  failures integer not null default 0,
  window_start timestamptz not null default now()
);
create table booth_private.entry_grants (
  token uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
alter table booth_private.entry_password enable row level security;
alter table booth_private.entry_grants enable row level security;
revoke all on booth_private.entry_password, booth_private.entry_grants from public, anon, authenticated;

create function booth_private.unlock_entry(p_password text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  credential booth_private.entry_password%rowtype;
  issued uuid;
begin
  select * into strict credential from booth_private.entry_password where singleton for update;
  if credential.window_start <= now() - interval '1 minute' then
    update booth_private.entry_password set failures = 0, window_start = now() where singleton;
  elsif credential.failures >= 10 then
    raise sqlstate 'PT429' using message = 'Please wait a minute before trying again.';
  end if;
  if p_password is null or octet_length(p_password) not between 1 and 64
     or extensions.crypt(p_password, credential.password_hash) is distinct from credential.password_hash then
    update booth_private.entry_password set failures = failures + 1 where singleton;
    return null;
  end if;
  delete from booth_private.entry_grants where expires_at <= now();
  insert into booth_private.entry_grants default values returning token into issued;
  return issued;
end;
$$;

create function booth_private.redeem_entry(p_token uuid) returns uuid
language sql security definer set search_path = '' as $$
  delete from booth_private.entry_grants where token = p_token and expires_at > now()
  returning gen_random_uuid();
$$;

create function public.booth_entry_unlock(p_password text) returns uuid
language sql security invoker set search_path = '' as $$
  select booth_private.unlock_entry(p_password);
$$;
create function public.booth_entry_redeem(p_token uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select booth_private.redeem_entry(p_token);
$$;
revoke all on function booth_private.unlock_entry(text), booth_private.redeem_entry(uuid),
  public.booth_entry_unlock(text), public.booth_entry_redeem(uuid) from public;
grant execute on function booth_private.unlock_entry(text), booth_private.redeem_entry(uuid),
  public.booth_entry_unlock(text), public.booth_entry_redeem(uuid) to anon, authenticated;
