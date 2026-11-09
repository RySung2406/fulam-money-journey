-- The website asks for an answer before check-in. The older two-argument
-- RPC still inserted a row with no choice, so a direct call could record a
-- day without answering. That RPC is removed. Every stored check-in already
-- has A, B or C, so the answer column is now required.
begin;

alter table public.check_ins
  alter column choice set not null;

drop function if exists public.submit_check_in(integer, boolean);
drop function if exists private.submit_check_in(integer, boolean);

comment on column public.check_ins.choice is
  'Required answer A, B or C. The first saved answer is kept.';

comment on table public.check_ins is
  'One check-in per verified member per programme day, with server timestamp, self-declared current HKU student eligibility, and answer A, B or C. No browser direct writes or public reads.';

comment on function public.submit_check_in(integer, boolean, text) is
  'Idempotent check-in. Requires answer A, B or C. The first saved answer is kept. Identity and timestamp are server controlled.';

notify pgrst, 'reload schema';

commit;
