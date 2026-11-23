-- Private storage for evidence uploads and generated documents.
--
-- Every file path starts with the business id: <business_id>/<...>/<file>.
-- Access follows the same rules as the tables:
--   read:   owners of that business and its assigned consultants
--   upload: owners of that business only
--   change or delete: nobody (files are part of the case record; archive the
--   documents row instead)
-- Both buckets are private: files are only reachable with short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('evidence', 'evidence', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('documents', 'documents', false, 10485760,
    array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The business id at the start of a storage path, or null if the path isn't valid.
create or replace function private.business_id_from_path(path text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(path, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(path, '/', 1)::uuid
  end;
$$;

grant execute on function private.business_id_from_path(text) to authenticated;

create policy "storage: owners and assigned consultants can read case files"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('evidence', 'documents')
    and private.can_view_business(private.business_id_from_path(name))
  );

create policy "storage: owners can upload case files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('evidence', 'documents')
    and private.is_owner_of(private.business_id_from_path(name))
  );
