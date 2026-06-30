-- Shared autocomplete master list for all admin record forms.
-- Remembers any value typed into an identifier field (quality, party, agency,
-- notes, mill, category) so it shows up in autofill next time — across record
-- types and devices, even if the line item was not fully saved.
-- Run this once in the Supabase SQL editor.

create table if not exists public.autocomplete_options (
  category   text not null,
  value      text not null,
  created_at timestamptz not null default now(),
  primary key (category, value)
);

alter table public.autocomplete_options enable row level security;

-- Anyone can read the suggestion list (admin pages are gated separately).
drop policy if exists "autocomplete read" on public.autocomplete_options;
create policy "autocomplete read"
  on public.autocomplete_options for select
  using (true);

-- Only signed-in admins can add new values.
drop policy if exists "autocomplete insert" on public.autocomplete_options;
create policy "autocomplete insert"
  on public.autocomplete_options for insert
  to authenticated
  with check (true);

-- Only signed-in admins can remove a saved suggestion (the × in the dropdown).
drop policy if exists "autocomplete delete" on public.autocomplete_options;
create policy "autocomplete delete"
  on public.autocomplete_options for delete
  to authenticated
  using (true);
