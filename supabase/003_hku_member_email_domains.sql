-- Allow verified HKU students, alumni and staff to sign in.
-- Exact domains confirmed by HKU ITS and the Alumni Office:
-- https://its.hku.hk/services/email-communications/email-and-calendar/
-- https://www.alumni.hku.hk/graduate-email/
-- Account access does not establish current enrollment or activity eligibility.
begin;

create or replace function private.enforce_school_email()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@(connect[.]hku[.]hk|graduate[.]hku[.]hk|hku[.]hk)$' then
    raise exception 'Only HKU member email addresses are allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_school_email() from public, anon, authenticated;

create or replace function public.hku_email_signup_hook(event jsonb)
returns jsonb language plpgsql stable set search_path = '' as $$
begin
  if coalesce(lower(event->'user'->>'email'), '') !~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@(connect[.]hku[.]hk|graduate[.]hku[.]hk|hku[.]hk)$' then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Please use your HKU student, alumni or staff email address.'));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hku_email_signup_hook(jsonb) from public, anon, authenticated;
grant execute on function public.hku_email_signup_hook(jsonb) to supabase_auth_admin;

create or replace function private.is_verified_school_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and lower(u.email) ~ '^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@(connect[.]hku[.]hk|graduate[.]hku[.]hk|hku[.]hk)$'
  );
$$;
revoke all on function private.is_verified_school_user() from public, anon, authenticated;
grant execute on function private.is_verified_school_user() to authenticated;

-- Existing triggers, own-profile RLS and read-only grants remain in force.
commit;
