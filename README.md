# Mark Master Masons portal

Next.js portal for Mark Master Masons, with a Supabase-backed admin for events, news and shop.

## Run

```bash
npm install
npm run dev
```

Without Supabase secrets the app uses sample data. Admin: `/admin/login` (any email/password in sample mode).

## Supabase

1. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Cursor Secrets.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create an Auth user, then set `profiles.role` to `super_admin`.

Mark Sites lodge microsites and Stripe dues come next.
