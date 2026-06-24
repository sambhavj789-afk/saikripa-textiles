-- ============================================================================
-- Saikripa Textiles — Catalogue (admin-editable) setup
-- Run this ONCE in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- 1. Catalogue table -------------------------------------------------------
create table if not exists public.catalogue (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  gsm           text,
  gsm_value     int,
  blend         text,
  construction  text,
  category      text,
  moq           text default '150 meters',
  colors        text,
  finish        text default 'Lustrous finish',
  uses          text,
  description   text,
  long_description text,
  image         text,                      -- cover image url
  images        jsonb default '[]'::jsonb, -- gallery image urls
  sort_order    int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.catalogue enable row level security;

-- Anyone can read (public website); only logged-in admins can change.
drop policy if exists "catalogue_read"  on public.catalogue;
create policy "catalogue_read"  on public.catalogue for select using (true);
drop policy if exists "catalogue_write" on public.catalogue;
create policy "catalogue_write" on public.catalogue for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. Storage bucket for catalogue images -----------------------------------
insert into storage.buckets (id, name, public)
values ('catalogue', 'catalogue', true)
on conflict (id) do nothing;

drop policy if exists "catalogue_img_read"   on storage.objects;
create policy "catalogue_img_read"   on storage.objects for select
  using (bucket_id = 'catalogue');
drop policy if exists "catalogue_img_insert" on storage.objects;
create policy "catalogue_img_insert" on storage.objects for insert
  with check (bucket_id = 'catalogue' and auth.role() = 'authenticated');
drop policy if exists "catalogue_img_update" on storage.objects;
create policy "catalogue_img_update" on storage.objects for update
  using (bucket_id = 'catalogue' and auth.role() = 'authenticated');
drop policy if exists "catalogue_img_delete" on storage.objects;
create policy "catalogue_img_delete" on storage.objects for delete
  using (bucket_id = 'catalogue' and auth.role() = 'authenticated');

-- 3. Seed the existing 6 collections ---------------------------------------
insert into public.catalogue
  (slug,title,gsm,gsm_value,blend,construction,category,moq,colors,finish,uses,description,long_description,image,images,sort_order)
values
($$superior-collection$$,$$Superior Collection$$,$$380 GSM$$,380,$$65/35 PV$$,$$65/35 PV$$,$$2/18 Matty$$,$$150 meters$$,$$60+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Our flagship 380 GSM suiting fabric with a lustrous finish and sharp, structured drape. Trusted for school and corporate uniforms, hospital staff wear, and police and security attire.$$,$$Superior Collection is Saikripa's flagship suiting fabric, refined over a decade for institutions that demand consistency. The 380 GSM weight gives a premium structured drape, while the 65/35 polyester-viscose blend balances durability with soft breathability. Its lustrous finish keeps school, corporate, hospital, and police uniforms looking crisp through full work-day wear and repeated industrial washes.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/superior1.jpg","/catalogue/superior2.jpg"]$$,1),
($$gold-club$$,$$Gold Club$$,$$345 GSM$$,345,$$65/35 PV$$,$$65/35 PV$$,$$2/18 Matty$$,$$150 meters$$,$$30+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Executive-grade 345 GSM fabric with a premium lustrous finish. A refined choice for corporate and school uniforms, hospital staff dress, and police and uniformed services.$$,$$Gold Club delivers a refined lustrous finish that reads as premium under both daylight and indoor lighting. The 345 GSM weight makes it lighter than Superior while keeping the body needed for structured uniforms — equally at home across corporate offices, schools, hospitals, and police and security forces.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/goldclub.jpg"]$$,2),
($$aura-plus$$,$$Aura Plus$$,$$380 GSM$$,380,$$Premium PV$$,$$Premium PV$$,$$2/18 Matty$$,$$150 meters$$,$$50+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Crafted with a premium PV blend for a soft-touch feel and a lustrous finish, without compromising structural integrity. Built for school and corporate uniforms, hospital wear, and police and institutional dress.$$,$$Aura Plus is for buyers who refuse to choose between comfort and structure. A premium polyester-viscose blend gives this 380 GSM fabric a soft-touch hand-feel and lustrous finish while maintaining the body needed for blazers and full uniforms — a popular choice across schools, corporate teams, hospitals, and police and uniformed services.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/auraplus.jpg"]$$,3),
($$innova$$,$$Innova$$,$$330 GSM$$,330,$$2/30×300 ROTO POLY$$,$$2/30×300 ROTO POLY$$,$$Gaberdine$$,$$150 meters$$,$$16+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Premium 330 GSM gaberdine-weave fabric with a lustrous finish and excellent crease recovery. Ideal for corporate, school, hospital, and police uniforms.$$,$$Innova brings the classic gaberdine weave into the Saikripa catalogue. The diagonal twill structure gives the fabric a distinctive surface and excellent recovery from creasing — a dependable choice for high-wear school, corporate, hospital, and police uniforms where appearance matters every day.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/innova.jpg"]$$,4),
($$milky-way$$,$$Milky Way$$,$$300 GSM$$,300,$$2/30×2/30$$,$$2/30×2/30$$,$$PV Trovin$$,$$150 meters$$,$$25+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Lightweight 300 GSM fabric with a lustrous finish, designed for warm climates. Widely used for school, corporate, hospital, and police summer uniforms.$$,$$Milky Way is engineered for Indian summers. At 300 GSM the fabric is light enough for hot-weather wear yet structured enough to hold uniform shape through a full work day. It's a go-to for schools, corporate teams, hospitals, and police and security forces across Rajasthan, Gujarat, and Madhya Pradesh.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/milkyway.jpg"]$$,5),
($$classic-p7200$$,$$Classic P/7200$$,$$270 GSM$$,270,$$2/30×1/15$$,$$2/30×1/15$$,$$PV Trovin$$,$$150 meters$$,$$14+ shades$$,$$Lustrous finish$$,$$School, Corporate, Hospital & Police Uniforms$$,$$Lightweight 270 GSM blend with a lustrous finish and reliable colour retention — built for everyday school, corporate, hospital, and police uniforms.$$,$$Classic P/7200 is Saikripa's most lightweight institutional fabric at 270 GSM — designed for high-volume orders where comfort across long working days matters. The fabric takes dye cleanly and resists fade through commercial laundering, making it ideal for school, corporate, hospital, and police uniforms.$$,$$/catalogue/cover.jpg$$,$$["/catalogue/cover.jpg","/catalogue/classic.jpg"]$$,6)
on conflict (slug) do nothing;
