-- รันไฟล์นี้ทั้งหมดใน Supabase SQL Editor (Project > SQL Editor > New query)
-- ========================================================================

create table if not exists public.app_users (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_topups (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_orders (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_products (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_donations (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- เปิดใช้งาน Realtime สำหรับตารางที่ต้องการให้อัปเดตทันที (เช่น admin เห็นสลิปใหม่)
-- ใช้ DO block เช็คก่อนว่าตารางอยู่ใน publication แล้วหรือยัง เพื่อให้รันซ้ำได้โดยไม่ error
do $$
declare
  tbl text;
begin
  foreach tbl in array array['app_users', 'app_topups', 'app_orders', 'app_products', 'app_donations']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
