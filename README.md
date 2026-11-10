# Mark Master Masons portal

Next.js portal for Mark Master Masons, with a Supabase-backed admin for events, news and shop.

## Run

```bash
npm install
npm run dev
```

Without Supabase secrets the public site uses sample content. The admin panel stays locked until Auth is connected.

## Supabase

1. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Cursor Secrets.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create an Auth user, then set `profiles.role` to `super_admin` in the SQL editor (members cannot promote themselves).
4. If the schema was already applied earlier, also run `supabase/fix-security.sql`.

Mark Sites lodge microsites and Stripe dues come next.
