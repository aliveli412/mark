-- Promote the portal admin Auth user to super_admin.
-- If role stays "member", run fix-admin-promote.sql first (trigger bug).

insert into public.profiles (id, email, full_name, role)
values (
  'ae90a6c9-d698-4397-bee9-582af7ca21e5',
  'info@etki.co.uk',
  '',
  'super_admin'
)
on conflict (id) do update
set
  email = excluded.email,
  role = 'super_admin';

select id, email, role from public.profiles
where email = 'info@etki.co.uk';
