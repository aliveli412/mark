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
- `SUPABASE_SERVICE_ROLE_KEY` (the **service_role** secret — not the anon key)
- `ADMIN_BOOTSTRAP_EMAIL=info@etki.co.uk` (auto-promotes this user on local sign-in)
- `SITE_URL=http://localhost:3000`
- `STRIPE_SECRET_KEY` (Stripe Dashboard → API keys, test mode)
- `STRIPE_WEBHOOK_SECRET` (from `stripe listen` locally, or a Dashboard webhook)

Then:

```powershell
npm install
npm run dev
```

`npm install` is required after pull so packages like `stripe` and `xlsx` are present.

Open http://localhost:3000 and admin at http://localhost:3000/admin/login

### Site looks unstyled / `Cannot find module …\.next\…\page.js`

That means the local `.next` cache is corrupt (often after a missing-package error). Stop the terminal (`Ctrl+C`), then:

```powershell
cd D:\projects\mark
git pull
npm install
npm run clean
npm run dev
```

Hard-refresh the browser (`Ctrl+Shift+R`). Do not keep an old `npm run dev` running while cleaning.
## Lodge memberships (Mark Sites)

Pilot lodge: **Freemasons Without Borders** (`/sites/freemasons-without-borders/membership`).

1. Run `supabase/memberships.sql` once (it upgrades older roster tables too).
   If you already hit `column "brother_no" does not exist`, run `supabase/fix-memberships-brother-no.sql` first, then re-run `memberships.sql`.
2. Seed FWB roster either by running `supabase/seed-fwb-roster.sql` **or** Admin → Memberships → FWB → **Re-import FWB Excel roster**.
3. Source Excel is stored at `content/memberships/source/As_of_06-06-2022.xlsx` (fields BrotherNo → Activity).
4. Set monthly/yearly/standing-order prices on the FWB membership admin page.
5. Members register on the lodge site with email and/or BrotherNo → match → pay via Stripe or bank standing order.
6. Keep `STRIPE_SECRET_KEY` / webhook configured so activations update automatically.

## Shop products + Stripe

1. Sign in at `/admin/login`.
2. Open **Admin → Shop → New product** (name, price in £, image path, Active).
3. Product appears on `/shop` when Active is checked.
4. Customer: Add to basket → Checkout → Stripe Checkout.
5. Paid rows appear under **Admin → Orders** after the webhook marks the session paid.

Local webhook forwarding:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Put the printed `whsec_…` into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Supabase (one-time)

1. Run `supabase/schema.sql` in the SQL editor (or `supabase/fix-login.sql` + `supabase/fix-security.sql` if an older schema is already there).
2. If events already existed before RSVP fields, also run `supabase/events-rsvp.sql`.
3. Create an Auth user (e.g. `info@etki.co.uk`).
4. Run `supabase/make-admin.sql` / `supabase/fix-admin-promote.sql` to set `profiles.role = 'super_admin'`.
5. Confirm with:

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
