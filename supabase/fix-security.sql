-- Optional: apply only the security fixes if schema.sql was already run.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists "Users update own profile name" on public.profiles;
drop policy if exists "Users update own full name" on public.profiles;
create policy "Users update own full name" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Super admins manage profiles" on public.profiles;
create policy "Super admins manage profiles" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not public.is_super_admin() then
      new.role := old.role;
    end if;
    if not public.is_admin() then
      new.id := old.id;
      new.email := old.email;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

revoke update on table public.profiles from anon, authenticated;
grant update (full_name, email, role) on table public.profiles to authenticated;
