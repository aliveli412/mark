-- Optional: apply only the security fixes if schema.sql was already run.

drop policy if exists "Users update own profile name" on public.profiles;
drop policy if exists "Users update own full name" on public.profiles;
create policy "Users update own full name" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if not public.is_admin() then
      new.id := old.id;
      new.email := old.email;
      new.role := old.role;
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
