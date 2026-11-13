-- Run once in the Supabase SQL editor (Dashboard → SQL).
-- Creates the portal schema for lodges, news, events, shop and admin roles.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('super_admin', 'lodge_admin', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.lodges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid references public.lodges (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid references public.lodges (id) on delete set null,
  lodge_slug text,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  location text not null default '',
  address text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  category text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  published boolean not null default false,
  rsvp_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_lodge_slug_starts_at_idx
  on public.events (lodge_slug, starts_at);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text not null,
  guests integer not null default 1 check (guests > 0 and guests <= 20),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_pence integer not null check (price_pence >= 0),
  image_path text not null default '',
  active boolean not null default true,
  stock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'fulfilled')),
  total_pence integer not null default 0,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_pence integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists event_rsvps_event_id_idx on public.event_rsvps (event_id);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists products_active_idx on public.products (active);

alter table public.profiles enable row level security;
alter table public.lodges enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

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
  -- Bypass RLS inside this helper so policies on profiles cannot recurse.
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- New accounts always start as members. Only a super_admin (or SQL) may promote them.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Public read published lodges" on public.lodges;
create policy "Public read published lodges" on public.lodges
  for select using (published = true or public.is_admin());

drop policy if exists "Admins manage lodges" on public.lodges;
create policy "Admins manage lodges" on public.lodges
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts" on public.posts
  for select using (published = true or public.is_admin());

drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published events" on public.events;
create policy "Public read published events" on public.events
  for select using (published = true or public.is_admin());

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can RSVP to open events" on public.event_rsvps;
create policy "Public can RSVP to open events" on public.event_rsvps
  for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.published = true and e.rsvp_enabled = true
    )
  );

drop policy if exists "Admins read RSVPs" on public.event_rsvps;
create policy "Admins read RSVPs" on public.event_rsvps
  for select using (public.is_admin());

drop policy if exists "Admins manage RSVPs" on public.event_rsvps;
create policy "Admins manage RSVPs" on public.event_rsvps
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products
  for select using (active = true or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders
  for select using (public.is_admin());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items" on public.order_items
  for select using (public.is_admin());

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users read own profile only" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;
-- Keep own-row reads free of is_admin() to avoid policy recursion.
create policy "Users read own profile only" on public.profiles
  for select using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles
  for select using (public.is_admin());

-- Members may only change their display name. Role changes are blocked below.
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
    -- Service role / SQL editor have no auth.uid(); allow those elevating paths.
    -- Authenticated clients may only change roles if they are already super_admin.
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

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Authenticated clients may touch these columns; the trigger above blocks
-- privilege escalation for anyone who is not already an admin.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name, email, role) on table public.profiles to authenticated;

-- Seed catalogue products (safe to re-run)
insert into public.products (slug, name, description, price_pence, image_path, active)
values
  (
    '325-ml-white-mug',
    '325 ml – White Mug',
    'MMM Online Store mug shared with Freemasons Without Borders.',
    450,
    '/images/mug.jpg',
    true
  ),
  (
    'english-turkish-ritual-no-1',
    'English & Turkish Ritual No. 1',
    'Mark Ritual No. 1 in English and Turkish.',
    750,
    '/images/ritual.jpg',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_pence = excluded.price_pence,
  image_path = excluded.image_path,
  active = excluded.active,
  updated_at = now();

insert into public.events (
  slug, title, summary, location, address, contact_name, category, starts_at, ends_at, published, rsvp_enabled
)
select * from (values
  (
    'mark-grand-lodge-communication',
    'Mark Grand Lodge Communication',
    'Regular communication of Mark Grand Lodge.',
    'Freemasons’ Hall, London',
    '60 Great Queen Street, London WC2B 5AZ',
    'Mark Grand Lodge',
    'Grand Lodge',
    (date_trunc('month', now()) + interval '20 days')::timestamptz,
    (date_trunc('month', now()) + interval '20 days' + interval '3 hours')::timestamptz,
    true,
    true
  ),
  (
    'provincial-meeting',
    'Provincial Meeting',
    'Open meeting for Mark lodges in the province.',
    'Provincial Lodge Rooms',
    '',
    'Provincial Office',
    'Province',
    (date_trunc('month', now()) + interval '1 month' + interval '10 days')::timestamptz,
    (date_trunc('month', now()) + interval '1 month' + interval '10 days' + interval '2 hours')::timestamptz,
    true,
    true
  )
) as seed(slug, title, summary, location, address, contact_name, category, starts_at, ends_at, published, rsvp_enabled)
where not exists (select 1 from public.events limit 1);

insert into public.posts (slug, title, excerpt, body, published, published_at)
select * from (values
  (
    'welcome-to-the-portal',
    'Welcome to the Mark Master Masons portal',
    'The portal now runs on Next.js with a Supabase admin.',
    'This is the first news item managed from the admin panel. Replace it when the live Supabase project is connected.',
    true,
    now()
  )
) as seed(slug, title, excerpt, body, published, published_at)
on conflict (slug) do nothing;
