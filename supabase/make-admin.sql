-- Promote the portal admin Auth user to super_admin.
-- Run in Supabase → SQL Editor after Auth user exists.
-- Replace uid/email if you use a different account.

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

-- Confirm:
select id, email, role from public.profiles
where email = 'info@etki.co.uk';
