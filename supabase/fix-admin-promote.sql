-- Fix: protect_profile_privileges was reverting role changes made via
-- service_role / SQL Editor (auth.uid() is null → treated as non-admin).
-- Run this once in Supabase SQL Editor, then sign in again locally.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if auth.uid() is not null then
      if new.role is distinct from old.role and not public.is_super_admin() then
        new.role := old.role;
      end if;
      if not public.is_admin() then
        new.id := old.id;
        new.email := old.email;
        new.created_at := old.created_at;
      end if;
    end if;
  end if;
  return new;
end;
$$;

insert into public.profiles (id, email, full_name, role)
values (
  'ae90a6c9-d698-4397-bee9-582af7ca21e5',
  'info@etki.co.uk',
  '',
  'super_admin'
)
on conflict (id) do update
set email = excluded.email, role = 'super_admin';

select id, email, role from public.profiles
where email = 'info@etki.co.uk';
