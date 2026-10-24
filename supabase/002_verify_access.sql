-- Manual verification in SQL Editor after migration 001.
-- All synthetic records are rolled back; this script does not send email.
begin;
select set_config('fulin.test.user_a', gen_random_uuid()::text, true);
select set_config('fulin.test.user_b', gen_random_uuid()::text, true);
select set_config('fulin.test.unverified', gen_random_uuid()::text, true);

insert into auth.users (id, email, email_confirmed_at, is_anonymous)
values
 (current_setting('fulin.test.user_a')::uuid, 'qa-' || current_setting('fulin.test.user_a') || '@connect.hku.hk', now(), false),
 (current_setting('fulin.test.user_b')::uuid, 'qa-' || current_setting('fulin.test.user_b') || '@connect.hku.hk', now(), false),
 (current_setting('fulin.test.unverified')::uuid, 'qa-' || current_setting('fulin.test.unverified') || '@connect.hku.hk', null, false);

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'SELECT')
     or has_table_privilege('authenticated', 'public.profiles', 'INSERT')
     or has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
     or has_table_privilege('authenticated', 'public.profiles', 'DELETE') then
    raise exception 'Unexpected table privilege';
  end if;
  if public.hku_email_signup_hook('{"user":{"email":"qa@example.com"}}'::jsonb)->'error' is null then
    raise exception 'Hook allowed a non-school address';
  end if;
  if public.hku_email_signup_hook('{"user":{"email":"qa@connect.hku.hk"}}'::jsonb) <> '{}'::jsonb then
    raise exception 'Hook rejected the school domain';
  end if;
  begin
    insert into auth.users (id, email) values (gen_random_uuid(), 'qa@example.com');
    raise exception 'Non-school insert was accepted';
  exception when check_violation then null;
  end;
  begin
    update auth.users set email = 'qa@example.com' where id = current_setting('fulin.test.user_a')::uuid;
    raise exception 'Non-school email change was accepted';
  exception when check_violation then null;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('fulin.test.user_a'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.profiles) <> 1
     or not exists (select 1 from public.profiles where id = current_setting('fulin.test.user_a')::uuid) then
    raise exception 'Verified user cannot read exactly their own profile';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('fulin.test.unverified'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.profiles) then
    raise exception 'Unverified user can read profiles';
  end if;
end $$;
reset role;
rollback;
select 'PASS: profile creation, exact-domain enforcement, read isolation, unverified denial, and write restrictions' as result;
