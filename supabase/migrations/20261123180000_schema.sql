-- FairStep schema (PRD §6). Row Level Security policies are in the next migration.
--
-- Principles:
--   * Tenant data carries business_id. Composite foreign keys make sure a case,
--     its employee, incident, events, documents and comments all belong to the
--     same business, so data can't be linked across businesses by mistake.
--   * No hard deletes of case data: foreign keys use ON DELETE RESTRICT, rows
--     are archived instead, and case_events is append-only (enforced by trigger,
--     which also binds the service role).
--   * POPIA: no ID numbers or home addresses are stored.
--   * Timestamps are timestamptz (stored UTC, shown in SAST by the app).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Users and businesses
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  role text not null default 'business_owner'
    check (role in ('business_owner', 'consultant', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per user. role is the platform role; only admins can change it.';

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  sector text check (char_length(sector) <= 80),
  province text check (
    province in (
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
      'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
    )
  ),
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'consultant')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_members_user_id_idx on public.business_members (user_id);

create table public.consultant_assignments (
  consultant_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (consultant_id, business_id)
);
create index consultant_assignments_business_id_idx on public.consultant_assignments (business_id);

-- ---------------------------------------------------------------------------
-- Employees and incidents
-- ---------------------------------------------------------------------------

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 80),
  employee_number text check (char_length(employee_number) <= 40),
  job_title text not null check (char_length(btrim(job_title)) between 1 and 80),
  start_date date,
  work_phone text check (char_length(work_phone) <= 30),
  work_email text check (char_length(work_email) <= 254),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);
create index employees_business_id_idx on public.employees (business_id);
create unique index employees_number_per_business_idx
  on public.employees (business_id, employee_number)
  where employee_number is not null;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  employee_id uuid not null,
  occurred_at timestamptz not null,
  location text not null check (char_length(btrim(location)) between 1 and 200),
  category text not null check (
    category in (
      'absenteeism', 'late_coming', 'dishonesty', 'theft', 'negligence',
      'insubordination', 'safety', 'substance_abuse', 'harassment',
      'damage_to_property', 'other'
    )
  ),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  witnesses text[] not null default '{}',
  reported_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (employee_id, business_id)
    references public.employees (id, business_id) on delete restrict
);
create index incidents_business_id_idx on public.incidents (business_id);
create index incidents_employee_id_idx on public.incidents (employee_id);
create index incidents_reported_by_idx on public.incidents (reported_by);

-- ---------------------------------------------------------------------------
-- Cases
-- ---------------------------------------------------------------------------

create sequence public.case_reference_seq;

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  business_id uuid not null references public.businesses (id) on delete restrict,
  employee_id uuid not null,
  incident_id uuid,
  current_step text not null default 'incident' check (
    current_step in ('incident', 'investigation', 'notice', 'hearing', 'outcome', 'appeal', 'closed')
  ),
  review_status text not null default 'not_requested' check (
    review_status in ('not_requested', 'pending_review', 'changes_requested', 'approved')
  ),
  -- Investigation, notice, hearing, outcome and appeal details (see src/lib/workflow/types.ts).
  step_data jsonb not null default '{}' check (jsonb_typeof(step_data) = 'object'),
  chairperson_name text check (char_length(chairperson_name) <= 120),
  complainant_name text check (char_length(complainant_name) <= 120),
  hearing_at timestamptz,
  outcome text not null default 'none'
    check (outcome in ('none', 'verbal', 'written', 'final_written', 'dismissal')),
  closed_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  -- One case per incident.
  unique (incident_id),
  foreign key (employee_id, business_id)
    references public.employees (id, business_id) on delete restrict,
  foreign key (incident_id, business_id)
    references public.incidents (id, business_id) on delete restrict,
  check ((current_step = 'closed') = (closed_at is not null))
);
create index cases_business_id_idx on public.cases (business_id);
create index cases_employee_id_idx on public.cases (employee_id);
create index cases_review_status_idx on public.cases (review_status) where review_status = 'pending_review';
create index cases_created_by_idx on public.cases (created_by);

-- FS-2026-0001: year of creation (SAST) plus a running number.
create or replace function public.set_case_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := 'FS-'
      || to_char(now() at time zone 'Africa/Johannesburg', 'YYYY')
      || '-'
      || lpad(nextval('public.case_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger cases_set_reference
  before insert on public.cases
  for each row execute function public.set_case_reference();

-- Append-only audit trail. business_id is copied from the case for fast RLS checks.
create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  business_id uuid not null,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z_.]{1,59}$'),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (case_id, business_id)
    references public.cases (id, business_id) on delete restrict
);
create index case_events_case_id_created_at_idx on public.case_events (case_id, created_at);
create index case_events_business_id_idx on public.case_events (business_id);
create index case_events_actor_id_idx on public.case_events (actor_id);

-- Blocks UPDATE and DELETE for everyone, including the service role.
create or replace function public.prevent_case_event_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'case_events is append-only: % is not allowed', tg_op
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger case_events_append_only
  before update or delete on public.case_events
  for each row execute function public.prevent_case_event_changes();

create trigger case_events_no_truncate
  before truncate on public.case_events
  for each statement execute function public.prevent_case_event_changes();

-- ---------------------------------------------------------------------------
-- Documents and comments
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  case_id uuid,
  incident_id uuid,
  kind text not null
    check (kind in ('evidence', 'notice', 'warning', 'final_warning', 'outcome', 'bundle')),
  -- Path inside the storage bucket; always starts with the business id.
  storage_path text not null unique check (storage_path like business_id::text || '/%'),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 200),
  mime_type text not null
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  check (case_id is not null or incident_id is not null),
  check (kind <> 'evidence' or incident_id is not null),
  foreign key (case_id, business_id)
    references public.cases (id, business_id) on delete restrict,
  foreign key (incident_id, business_id)
    references public.incidents (id, business_id) on delete restrict
);
create index documents_business_id_idx on public.documents (business_id);
create index documents_case_id_idx on public.documents (case_id);
create index documents_incident_id_idx on public.documents (incident_id);
create index documents_created_by_idx on public.documents (created_by);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  business_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  foreign key (case_id, business_id)
    references public.cases (id, business_id) on delete restrict
);
create index comments_case_id_created_at_idx on public.comments (case_id, created_at);
create index comments_business_id_idx on public.comments (business_id);
create index comments_author_id_idx on public.comments (author_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger employees_set_updated_at before update on public.employees
  for each row execute function public.set_updated_at();
create trigger incidents_set_updated_at before update on public.incidents
  for each row execute function public.set_updated_at();
create trigger cases_set_updated_at before update on public.cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New users
-- ---------------------------------------------------------------------------

-- Every new auth user gets a profile. The role is ALWAYS business_owner here:
-- sign-up metadata is controlled by the user, so it can never grant a role.
-- Admins promote consultants and admins afterwards.
-- If the sign-up form sent a business name, the owner's business is created
-- in the same transaction, so a new owner never exists without a business.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  business_name text := nullif(btrim(new.raw_user_meta_data ->> 'business_name'), '');
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );

  if business_name is not null then
    insert into public.businesses (name)
    values (left(business_name, 120))
    returning id into new_business_id;

    insert into public.business_members (business_id, user_id, member_role)
    values (new_business_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
