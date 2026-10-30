-- Run after 003. Synthetic users exist only inside this rolled-back transaction.
-- No email is sent and no real user is changed.
begin;
select set_config('fulam.test.student', gen_random_uuid()::text, true);
select set_config('fulam.test.alumni', gen_random_uuid()::text, true);
select set_config('fulam.test.staff', gen_random_uuid()::text, true);
select set_config('fulam.test.unverified', gen_random_uuid()::text, true);
select set_config('fulam.test.anonymous', gen_random_uuid()::text, true);

insert into auth.users (id, email, email_confirmed_at, is_anonymous)
values
 (current_setting('fulam.test.student')::uuid, 'qa-' || current_setting('fulam.test.student') || '@connect.hku.hk', now(), false),
 (current_setting('fulam.test.alumni')::uuid, 'qa-' || current_setting('fulam.test.alumni') || '@graduate.hku.hk', now(), false),
 (current_setting('fulam.test.staff')::uuid, 'qa-' || current_setting('fulam.test.staff') || '@hku.hk', now(), false),
 (current_setting('fulam.test.unverified')::uuid, 'qa-' || current_setting('fulam.test.unverified') || '@hku.hk', null, false),
 (current_setting('fulam.test.anonymous')::uuid, 'qa-' || current_setting('fulam.test.anonymous') || '@graduate.hku.hk', now(), true);

do $$
declare address text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'RLS must stay enabled';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'SELECT')
     or has_table_privilege('authenticated', 'public.profiles', 'INSERT')
     or has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
     or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
     or has_function_privilege('anon', 'public.hku_email_signup_hook(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.hku_email_signup_hook(jsonb)', 'EXECUTE') then
    raise exception 'Unexpected account access privilege';
  end if;
  foreach address in array array['qa@connect.hku.hk', 'qa@graduate.hku.hk', 'qa@hku.hk', 'QA@GRADUATE.HKU.HK'] loop
    if public.hku_email_signup_hook(jsonb_build_object('user',jsonb_build_object('email',address))) <> '{}'::jsonb then
      raise exception 'Hook rejected an allowed HKU domain: %', address;
    end if;
  end loop;
  foreach address in array array['qa@example.com', 'qa@hku.hk.attacker.com', 'qa@evilhku.hk', 'qa@sub.hku.hk', 'qa@sub.graduate.hku.hk', 'qa@graduate.hku.hk.attacker.com', 'qa@alumni.hku.hk', 'Name <qa@hku.hk>', 'qa@@hku.hk'] loop
    if public.hku_email_signup_hook(jsonb_build_object('user',jsonb_build_object('email',address)))->'error' is null then
      raise exception 'Hook accepted an invalid domain or address: %', address;
    end if;
    begin
      insert into auth.users (id,email) values (gen_random_uuid(),address);
      raise exception 'Trigger accepted an invalid address: %', address;
    exception when check_violation then null;
    end;
  end loop;
  begin
    update auth.users set email='qa@example.com' where id=current_setting('fulam.test.staff')::uuid;
    raise exception 'Non-HKU email change was accepted';
  exception when check_violation then null;
  end;
end $$;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('fulam.test.student'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.profiles) <> 1 or not exists (select 1 from public.profiles where id=current_setting('fulam.test.student')::uuid) then
    raise exception 'Student access is not restricted to their own profile';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('fulam.test.alumni'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.profiles) <> 1 or not exists (select 1 from public.profiles where id=current_setting('fulam.test.alumni')::uuid) then
    raise exception 'Alumni access is not restricted to their own profile';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('fulam.test.staff'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.profiles) <> 1 or not exists (select 1 from public.profiles where id=current_setting('fulam.test.staff')::uuid) then
    raise exception 'Staff access is not restricted to their own profile';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('fulam.test.unverified'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if exists (select 1 from public.profiles) then raise exception 'Unverified member can read profiles'; end if;
end $$;
reset role;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('fulam.test.anonymous'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if exists (select 1 from public.profiles) then raise exception 'Anonymous member can read profiles'; end if;
end $$;
reset role;

rollback;
select 'PASS: three HKU domains accepted; outsiders, deceptive domains, unverified and anonymous users denied; profiles isolated; synthetic records rolled back' as result;
