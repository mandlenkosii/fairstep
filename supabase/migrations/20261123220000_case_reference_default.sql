-- Case references (FS-2026-0001) become a column default instead of a trigger,
-- so the generated TypeScript types know the app doesn't need to supply one.

create or replace function public.next_case_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'FS-'
    || to_char(now() at time zone 'Africa/Johannesburg', 'YYYY')
    || '-'
    || lpad(nextval('public.case_reference_seq')::text, 4, '0');
$$;

alter table public.cases alter column reference set default public.next_case_reference();

drop trigger if exists cases_set_reference on public.cases;
drop function if exists public.set_case_reference();
