-- Row Level Security for every table (PRD §7 permission matrix).
--
-- Who sees what:
--   business_owner: only businesses they are a member of (business_members)
--   consultant:     only businesses assigned to them (consultant_assignments);
--                   can comment and review, never delete, never edit case facts
--   admin:          users, businesses and assignments; no employee or case data
--
-- Nobody can delete case data. case_events is also protected by a trigger.
-- The anon role (not logged in) gets nothing.

-- ---------------------------------------------------------------------------
-- Helper functions (in a schema the API doesn't expose)
-- SECURITY DEFINER so they can read membership tables without hitting RLS
-- themselves (which would recurse). Each one only answers about the caller.
-- ---------------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;

-- Owner (or case manager) of this business.
create or replace function private.is_owner_of(business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members m
    join public.profiles p on p.id = m.user_id
    where m.business_id = business
      and m.user_id = (select auth.uid())
      and p.role = 'business_owner'
  );
$$;

create or replace function private.is_assigned_consultant(business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consultant_assignments a
    join public.profiles p on p.id = a.consultant_id
    where a.business_id = business
      and a.consultant_id = (select auth.uid())
      and p.role = 'consultant'
  );
$$;

-- Can read this business's employees, incidents and cases.
create or replace function private.can_view_business(business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_owner_of(business) or private.is_assigned_consultant(business);
$$;

-- Do the caller and this user work on a common business? (Used to show names on timelines.)
create or replace function private.shares_business_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select business_id from public.business_members where user_id = (select auth.uid())
    union
    select business_id from public.consultant_assignments where consultant_id = (select auth.uid())
  ),
  theirs as (
    select business_id from public.business_members where user_id = other_user
    union
    select business_id from public.consultant_assignments where consultant_id = other_user
  )
  select exists (select 1 from mine join theirs using (business_id));
$$;

create or replace function private.has_role(user_id uuid, wanted text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = user_id and role = wanted);
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Not logged in: no access to any table.
-- ---------------------------------------------------------------------------

revoke all on
  public.profiles, public.businesses, public.business_members, public.consultant_assignments,
  public.employees, public.incidents, public.cases, public.case_events, public.documents,
  public.comments
from anon;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.consultant_assignments enable row level security;
alter table public.employees enable row level security;
alter table public.incidents enable row level security;
alter table public.cases enable row level security;
alter table public.case_events enable row level security;
alter table public.documents enable row level security;
alter table public.comments enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles: read own, colleagues', or all as admin"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
    or private.shares_business_with(id)
  );

create policy "profiles: update own name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Only the name can be changed by users. Roles change through the admin
-- server action (service role, after a server-side admin check).
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create policy "businesses: owners, assigned consultants and admins can read"
  on public.businesses for select to authenticated
  using ((select private.is_admin()) or private.can_view_business(id));

create policy "businesses: admins can create"
  on public.businesses for insert to authenticated
  with check ((select private.is_admin()));

create policy "businesses: owners and admins can edit details"
  on public.businesses for update to authenticated
  using ((select private.is_admin()) or private.is_owner_of(id))
  with check ((select private.is_admin()) or private.is_owner_of(id));

revoke update on public.businesses from authenticated;
grant update (name, sector, province) on public.businesses to authenticated;

-- ---------------------------------------------------------------------------
-- business_members
-- ---------------------------------------------------------------------------

create policy "members: read own business's members"
  on public.business_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or private.can_view_business(business_id)
  );

-- Owners can add case managers to their own business; admins can add anyone.
create policy "members: owners add managers, admins add anyone"
  on public.business_members for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      private.is_owner_of(business_id)
      and member_role = 'manager'
      and private.has_role(user_id, 'business_owner')
    )
  );

create policy "members: admins can remove"
  on public.business_members for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- consultant_assignments (admin only)
-- ---------------------------------------------------------------------------

create policy "assignments: consultant, the business's owners and admins can read"
  on public.consultant_assignments for select to authenticated
  using (
    consultant_id = (select auth.uid())
    or (select private.is_admin())
    or private.is_owner_of(business_id)
  );

create policy "assignments: admins assign consultants"
  on public.consultant_assignments for insert to authenticated
  with check (
    (select private.is_admin())
    and assigned_by = (select auth.uid())
    and private.has_role(consultant_id, 'consultant')
  );

create policy "assignments: admins unassign consultants"
  on public.consultant_assignments for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- employees (owners edit; assigned consultants read; admins see nothing)
-- ---------------------------------------------------------------------------

create policy "employees: owners and assigned consultants can read"
  on public.employees for select to authenticated
  using (private.can_view_business(business_id));

create policy "employees: owners can add"
  on public.employees for insert to authenticated
  with check (private.is_owner_of(business_id));

create policy "employees: owners can edit and archive"
  on public.employees for update to authenticated
  using (private.is_owner_of(business_id))
  with check (private.is_owner_of(business_id));

revoke update on public.employees from authenticated;
grant update (first_name, last_name, employee_number, job_title, start_date, work_phone, work_email, status)
  on public.employees to authenticated;

-- ---------------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------------

create policy "incidents: owners and assigned consultants can read"
  on public.incidents for select to authenticated
  using (private.can_view_business(business_id));

create policy "incidents: owners can log"
  on public.incidents for insert to authenticated
  with check (private.is_owner_of(business_id) and reported_by = (select auth.uid()));

create policy "incidents: owners can edit and archive"
  on public.incidents for update to authenticated
  using (private.is_owner_of(business_id))
  with check (private.is_owner_of(business_id));

revoke update on public.incidents from authenticated;
grant update (occurred_at, location, category, description, witnesses, archived_at)
  on public.incidents to authenticated;

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------

create policy "cases: owners and assigned consultants can read"
  on public.cases for select to authenticated
  using (private.can_view_business(business_id));

create policy "cases: owners can open"
  on public.cases for insert to authenticated
  with check (private.is_owner_of(business_id) and created_by = (select auth.uid()));

-- R11: a closed case can't be changed (the USING clause checks the row as it was).
create policy "cases: owners update open cases"
  on public.cases for update to authenticated
  using (private.is_owner_of(business_id) and closed_at is null)
  with check (private.is_owner_of(business_id));

create policy "cases: assigned consultants update review status of open cases"
  on public.cases for update to authenticated
  using (private.is_assigned_consultant(business_id) and closed_at is null)
  with check (private.is_assigned_consultant(business_id));

revoke update on public.cases from authenticated;
grant update (
  current_step, review_status, step_data, chairperson_name, complainant_name,
  hearing_at, outcome, closed_at, archived_at
) on public.cases to authenticated;

-- Consultants may only change review_status, and only pending_review → changes_requested
-- or approved. Owners may only send for review (not_requested/changes_requested →
-- pending_review). Nobody else can change review_status. The service role
-- (seed scripts) has no auth.uid() and is not limited.
create or replace function public.guard_case_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_role text := private.current_user_role();
begin
  if caller is null then
    return new;
  end if;

  if caller_role = 'consultant' then
    if (to_jsonb(new) - 'review_status' - 'updated_at') <> (to_jsonb(old) - 'review_status' - 'updated_at') then
      raise exception 'Consultants can review a case but not change its facts.'
        using errcode = 'insufficient_privilege';
    end if;
    if new.review_status is distinct from old.review_status
      and not (old.review_status = 'pending_review' and new.review_status in ('changes_requested', 'approved')) then
      raise exception 'A consultant can only approve or request changes on a case that is waiting for review.'
        using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if new.review_status is distinct from old.review_status
    and not (old.review_status in ('not_requested', 'changes_requested') and new.review_status = 'pending_review') then
    raise exception 'Only the assigned consultant can approve a case or request changes.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger cases_guard_update
  before update on public.cases
  for each row execute function public.guard_case_update();

-- ---------------------------------------------------------------------------
-- case_events (append-only: select and insert only)
-- ---------------------------------------------------------------------------

create policy "case events: owners and assigned consultants can read"
  on public.case_events for select to authenticated
  using (private.can_view_business(business_id));

create policy "case events: owners and assigned consultants add their own events"
  on public.case_events for insert to authenticated
  with check (private.can_view_business(business_id) and actor_id = (select auth.uid()));

revoke update, delete, truncate on public.case_events from authenticated;

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create policy "documents: owners and assigned consultants can read"
  on public.documents for select to authenticated
  using (private.can_view_business(business_id));

create policy "documents: owners can add"
  on public.documents for insert to authenticated
  with check (private.is_owner_of(business_id) and created_by = (select auth.uid()));

create policy "documents: owners can archive"
  on public.documents for update to authenticated
  using (private.is_owner_of(business_id))
  with check (private.is_owner_of(business_id));

revoke update on public.documents from authenticated;
grant update (archived_at) on public.documents to authenticated;

-- ---------------------------------------------------------------------------
-- comments (no edits or deletes: they're part of the record)
-- ---------------------------------------------------------------------------

create policy "comments: owners and assigned consultants can read"
  on public.comments for select to authenticated
  using (private.can_view_business(business_id));

create policy "comments: owners and assigned consultants can comment"
  on public.comments for insert to authenticated
  with check (private.can_view_business(business_id) and author_id = (select auth.uid()));

revoke update, delete, truncate on public.comments from authenticated;

-- Nobody deletes these through the API (RLS has no delete policy; this makes it explicit).
revoke delete, truncate on
  public.profiles, public.businesses, public.employees, public.incidents, public.cases,
  public.documents
from authenticated;
