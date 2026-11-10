# Mark Master Masons portal

Next.js portal for Mark Master Masons, with a Supabase-backed admin for events, news and shop.

GitHub: https://github.com/aliveli412/mark

## Local setup (Windows — `D:\projects`)

In PowerShell:

```powershell
cd D:\projects
git clone https://github.com/aliveli412/mark.git
cd mark
git checkout cursor/nextjs-portal-c856
npm install
copy .env.example .env.local
```

Edit `.env.local` with your Supabase Project Settings → API values:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then:

```powershell
npm run dev
```

Open http://localhost:3000 and admin at http://localhost:3000/admin/login

## Supabase (one-time)

1. Run `supabase/schema.sql` in the SQL editor (or `supabase/fix-login.sql` + `supabase/fix-security.sql` if an older schema is already there).
2. Create an Auth user (e.g. `info@etki.co.uk`).
3. Run `supabase/make-admin.sql` to set `profiles.role = 'super_admin'`.
4. Confirm with:

```sql
select id, email, role from public.profiles where email = 'info@etki.co.uk';
```

The row must show `role = super_admin`. If the select returns no rows, the insert did not land — re-run `make-admin.sql` after `schema.sql`.

Without `.env.local`, public pages use sample content and admin stays locked.

## Scripts

```bash
npm run dev    # local development
npm run build  # production build
npm run start  # serve production build
```
