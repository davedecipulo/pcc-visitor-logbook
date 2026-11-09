# PCC Visitor Logbook

Visitor registration and monitoring system for **Passi City College (PCC)**.
It replaces the paper logbook at the gate with a self-service kiosk, plus a staff dashboard.

- **Kiosk** (`/`): visitors tap **Time In**, fill in the form, and tap **Time Out** when leaving
  (confirmed with the last 4 digits of their contact number).
- **Admin** (`/admin`): live list of who is on campus, today's stats, a searchable logbook,
  CSV export and printing, and staff time-out for visitors who forgot.

Stack: Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (Postgres + Auth).

---

## Setup

### 1. Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

### 2. Create an admin account

1. In Supabase, go to **Authentication → Users → Add user → Create new user**, enter an email and password,
   and tick **Auto Confirm User**.
2. In the **SQL Editor**, register that user as an admin:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'admin@pcc.edu.ph';
   ```

3. Recommended: go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**.

### 3. Environment variables

Edit `.env.local` (already copied from `.env.example`) using **Project Settings → API Keys**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (or the legacy `anon` key) |
| `SUPABASE_SECRET_KEY` | Secret key (or the legacy `service_role` key). **Keep it private.** |

### 4. Run

```bash
npm install
npm run dev          # http://localhost:3000
```

For the gate PC or tablet, run `npm run build && npm start` (or deploy to Vercel) and open the site in
full-screen or kiosk mode (for example, `chrome --kiosk http://your-site`).

---

## Adding the PCC logo

1. Save the logo as `public/pcc-logo.png` (a square PNG with a transparent background works best).
2. In [`src/lib/config.ts`](src/lib/config.ts), set `logoSrc: "/pcc-logo.png"`.

The logo appears on the kiosk, the login page, and the admin header. Brand colours are in
[`src/app/globals.css`](src/app/globals.css) (`--color-brand-*`).

Purposes of visit and the office list are also in `src/lib/config.ts`.

---

## Security design

- **RLS is on for every table.** The anonymous role has no access at all.
- The kiosk never talks to Supabase from the browser. It calls **server actions** that validate input
  and use the secret key on the server only (`src/lib/supabase/service.ts`, protected with `server-only`).
- The time-out search returns only name, office and time in, never contact details or addresses.
  Timing out requires the last 4 digits of the visitor's contact number.
- Admin pages use the logged-in user's session, so Postgres enforces `is_admin()` itself.
  Being logged in is not enough: the user must also be in `admin_users`.
- Logbook entries cannot be deleted through the API.
- CSV export escapes formula characters to prevent spreadsheet injection.

## Project structure

```
supabase/schema.sql               Database tables, RLS policies
src/proxy.ts                      Session refresh + /admin redirect
src/app/(kiosk)/                  Visitor kiosk: home, time-in, time-out, server actions
src/app/admin/login/              Staff login
src/app/admin/(protected)/        Dashboard, logbook, CSV export
src/lib/config.ts                 School name, logo, purposes, offices
src/lib/supabase/                 Supabase clients (session + server-only service)
```
