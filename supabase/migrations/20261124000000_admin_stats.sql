-- Aggregate numbers for platform admins (PRD A3).
--
-- RLS stops admins reading employee and case rows (POPIA data minimisation),
-- so these SECURITY DEFINER functions return COUNTS ONLY: no names, no case
-- details. Each one refuses anyone who isn't an admin.

create or replace function public.admin_business_overview()
returns table (
  business_id uuid,
  name text,
  sector text,
  province text,
  plan text,
  created_at timestamptz,
  active_employees bigint,
  open_cases bigint,
  pending_review bigint,
  consultant_ids uuid[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only FairStep admins can see platform statistics.'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    b.id,
    b.name,
    b.sector,
    b.province,
    b.plan,
    b.created_at,
    (select count(*) from public.employees e where e.business_id = b.id and e.status = 'active'),
    (select count(*) from public.cases c
      where c.business_id = b.id and c.closed_at is null and c.archived_at is null),
    (select count(*) from public.cases c
      where c.business_id = b.id and c.review_status = 'pending_review' and c.closed_at is null),
    coalesce(
      (select array_agg(a.consultant_id order by a.created_at)
        from public.consultant_assignments a where a.business_id = b.id),
      '{}'
    )
  from public.businesses b
  where b.archived_at is null
  order by b.name;
end;
$$;

create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Only FairStep admins can see platform statistics.'
      using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'businesses', (select count(*) from public.businesses where archived_at is null),
    'owners', (select count(*) from public.profiles where role = 'business_owner'),
    'consultants', (select count(*) from public.profiles where role = 'consultant'),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'open_cases', (select count(*) from public.cases where closed_at is null and archived_at is null),
    'closed_cases', (select count(*) from public.cases where closed_at is not null),
    'incidents_30_days', (select count(*) from public.incidents
      where occurred_at > now() - interval '30 days'),
    'cases_by_step', coalesce((
      select jsonb_object_agg(current_step, n)
      from (select current_step, count(*) as n from public.cases
            where archived_at is null group by current_step) s
    ), '{}'::jsonb),
    'cases_by_review', coalesce((
      select jsonb_object_agg(review_status, n)
      from (select review_status, count(*) as n from public.cases
            where archived_at is null and closed_at is null group by review_status) s
    ), '{}'::jsonb),
    -- Average hours from "sent for review" to the consultant's decision.
    'avg_review_hours', (
      select round(avg(extract(epoch from (d.created_at - r.created_at)) / 3600)::numeric, 1)
      from public.case_events r
      join lateral (
        select e.created_at from public.case_events e
        where e.case_id = r.case_id
          and e.event_type in ('review.approved', 'review.changes_requested')
          and e.created_at > r.created_at
        order by e.created_at
        limit 1
      ) d on true
      where r.event_type = 'review.requested'
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_business_overview() from public, anon;
revoke all on function public.admin_platform_stats() from public, anon;
grant execute on function public.admin_business_overview() to authenticated;
grant execute on function public.admin_platform_stats() to authenticated;
