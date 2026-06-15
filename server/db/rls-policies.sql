-- ============================================================================
-- Row Level Security — audit & recommended baseline
-- Saikripa Textiles (Supabase / Postgres)
--
-- HOW TO USE: open Supabase Dashboard -> SQL Editor and run section 1 first to
-- SEE your current state. Only run section 2 if a table is missing the intended
-- policies. Review every statement before running — this touches access control.
--
-- Context: single-tenant admin app. There is no per-user resource ownership, so
-- the authorization rule is "authenticated admins can manage business data;
-- the public can only create appointments (booking form)". Enforcement lives
-- here in the DB because the browser queries Supabase directly with the public
-- (publishable/anon) key.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1) AUDIT: what is the current posture? (read-only — safe to run anytime)
-- ---------------------------------------------------------------------------

-- Is RLS enabled on each table? (rls_enabled must be true for all)
select schemaname, tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('sales_records','purchase_records','bill_items','appointments')
order by tablename;

-- What policies already exist, and for which role/command?
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('sales_records','purchase_records','bill_items','appointments')
order by tablename, cmd;


-- ---------------------------------------------------------------------------
-- 2) RECOMMENDED BASELINE (apply only where the audit shows gaps)
--
-- Verified 2026-06-15: the public/anon key is already BLOCKED from writing to
-- these tables (insert -> "new row violates row-level security policy"), so RLS
-- is already enabled and denying anonymous access. The statements below make
-- the intended rules explicit/idempotent. `drop policy if exists` lets you
-- re-run safely, but DO NOT drop a policy you rely on without reading it first.
-- ---------------------------------------------------------------------------

-- Ensure RLS is on (no-op if already enabled).
alter table public.sales_records    enable row level security;
alter table public.purchase_records enable row level security;
alter table public.bill_items       enable row level security;
alter table public.appointments     enable row level security;

-- --- Business data: authenticated (admin) users only, all operations ---------
-- sales_records
drop policy if exists "admin_all_sales_records" on public.sales_records;
create policy "admin_all_sales_records" on public.sales_records
  for all  to authenticated
  using (true) with check (true);

-- purchase_records
drop policy if exists "admin_all_purchase_records" on public.purchase_records;
create policy "admin_all_purchase_records" on public.purchase_records
  for all  to authenticated
  using (true) with check (true);

-- bill_items (child of sales_records)
drop policy if exists "admin_all_bill_items" on public.bill_items;
create policy "admin_all_bill_items" on public.bill_items
  for all  to authenticated
  using (true) with check (true);

-- --- Appointments: public may CREATE (booking form); admins manage -----------
-- Allow anonymous + authenticated to INSERT a booking…
drop policy if exists "public_insert_appointments" on public.appointments;
create policy "public_insert_appointments" on public.appointments
  for insert to anon, authenticated
  with check (true);

-- …but only authenticated (admin) users may read / update / delete them.
drop policy if exists "admin_read_appointments" on public.appointments;
create policy "admin_read_appointments" on public.appointments
  for select to authenticated using (true);

drop policy if exists "admin_update_appointments" on public.appointments;
create policy "admin_update_appointments" on public.appointments
  for update to authenticated using (true) with check (true);

drop policy if exists "admin_delete_appointments" on public.appointments;
create policy "admin_delete_appointments" on public.appointments
  for delete to authenticated using (true);

-- NOTE on "to authenticated": in this single-tenant app every logged-in user is
-- an admin, so `to authenticated` IS the admin gate. To restrict to a subset of
-- users, add a profiles table with a role column and change `using`/`with check`
-- to e.g. `(select role from public.profiles where id = auth.uid()) = 'admin'`.
