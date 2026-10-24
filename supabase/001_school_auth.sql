-- Run once in a NEW Supabase project using the SQL editor or migration tooling.
-- This migration creates only the minimum account record, without game content.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.enforce_school_email()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@connect[.]hku[.]hk$' then
    raise exception 'Only HKU Connect email addresses are allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_school_email() from public, anon, authenticated;

-- Enforces the domain on new accounts AND on later email changes, even if the
-- optional Before User Created hook has not yet been enabled in the dashboard.
create trigger fulin_enforce_school_email
before insert or update of email on auth.users
for each row execute function private.enforce_school_email();

create or replace function public.hku_email_signup_hook(event jsonb)
returns jsonb language plpgsql stable set search_path = '' as $$
begin
  if coalesce(lower(event->'user'->>'email'), '') !~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@connect[.]hku[.]hk$' then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Please use your HKU Connect email address.'));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hku_email_signup_hook(jsonb) from public, anon, authenticated;
grant execute on function public.hku_email_signup_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  participant_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_at timestamptz not null default now(),
  constraint participant_code_format check (participant_code ~ '^[A-F0-9]{12}$')
);
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

create or replace function private.is_verified_school_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and lower(u.email) ~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@connect[.]hku[.]hk$'
  );
$$;
revoke all on function private.is_verified_school_user() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_verified_school_user() to authenticated;

create policy "verified users read only their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) and (select private.is_verified_school_user()));

create or replace function private.create_school_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
revoke all on function private.create_school_profile() from public, anon, authenticated;
create trigger fulin_create_school_profile after insert on auth.users
for each row execute function private.create_school_profile();

comment on table public.profiles is 'Minimal account profile. Verified email is not proof of current HKU enrollment. No browser insert/update/delete permissions.';
commit;
