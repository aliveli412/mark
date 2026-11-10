-- Run this if admin login crashes or loops after schema.sql was already applied.

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  perform set_config('row_security', 'off', true);
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin', 'lodge_admin')
  ) into allowed;
  return coalesce(allowed, false);
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  perform set_config('row_security', 'off', true);
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  ) into allowed;
  return coalesce(allowed, false);
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users read own profile only" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Users read own profile only" on public.profiles
  for select using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles
  for select using (public.is_admin());

-- Ensure your Auth user has a profile row and admin role.
-- Replace the email, then run:
--
-- insert into public.profiles (id, email, full_name, role)
-- select id, email, coalesce(raw_user_meta_data->>'full_name', ''), 'super_admin'
-- from auth.users
-- where email = 'SENIN_EMAIL@ornek.com'
-- on conflict (id) do update
-- set email = excluded.email, role = 'super_admin';
