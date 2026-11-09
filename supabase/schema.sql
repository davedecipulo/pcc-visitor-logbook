-- =====================================================================
-- PCC Visitor Logbook — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- Visitors logbook
-- ---------------------------------------------------------------------
create table if not exists public.visitors (
  id                     uuid primary key default gen_random_uuid(),
  log_no                 bigint generated always as identity unique,

  full_name              text not null check (char_length(full_name) between 2 and 120),
  contact_number         text not null check (contact_number ~ '^09\d{9}$'),
  address                text not null check (char_length(address) between 2 and 250),

  purpose                text not null check (char_length(purpose) between 2 and 80),
  purpose_details        text check (char_length(purpose_details) <= 250),
  office_to_visit        text not null check (char_length(office_to_visit) between 2 and 80),
  person_to_visit        text check (char_length(person_to_visit) <= 120),

  student_name           text check (char_length(student_name) <= 120),
  student_course_year    text check (char_length(student_course_year) <= 80),

  time_in                timestamptz not null default now(),
  time_out               timestamptz,
  timed_out_by           text check (timed_out_by in ('visitor', 'admin')),

  constraint time_out_after_time_in check (time_out is null or time_out >= time_in)
);

create index if not exists visitors_time_in_idx on public.visitors (time_in desc);
create index if not exists visitors_inside_idx  on public.visitors (time_in) where time_out is null;

-- ---------------------------------------------------------------------
-- Admin allow-list (only users listed here can open the dashboard)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
--   • The public kiosk never talks to Supabase from the browser. It goes
--     through Next.js server actions using the secret key, so anon gets
--     NO access at all.
--   • Logged-in admins can read logs and record a time-out.
--   • Nobody can delete logbook entries through the API.
-- ---------------------------------------------------------------------
alter table public.visitors    enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "admins read visitors"   on public.visitors;
drop policy if exists "admins update visitors" on public.visitors;
drop policy if exists "users read own admin row" on public.admin_users;

create policy "admins read visitors"
  on public.visitors for select
  to authenticated
  using ((select public.is_admin()));

create policy "admins update visitors"
  on public.visitors for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "users read own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- After creating your admin account in Authentication → Users,
-- register it as an admin (replace the email):
--
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'admin@pcc.edu.ph';
-- ---------------------------------------------------------------------
