-- Freal Boxser: Supabase schema
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

-- ให้สิทธิ์ role anon/authenticated เข้าถึงตารางผ่าน Data API (REST/supabase-js)
-- จำเป็นสำหรับ Supabase โปรเจกต์ที่สร้างหลัง 30 พ.ค. 2026 เป็นต้นไป
-- (ค่า default เปลี่ยนเป็น "ไม่เปิดให้อัตโนมัติ" แล้ว ต้อง grant เอง)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table
  public.app_users,
  public.app_topups,
  public.app_orders,
  public.app_products,
  public.app_donations
to anon, authenticated;

-- เปิดใช้งาน Realtime แบบเช็คก่อนว่ามีอยู่แล้วหรือยัง (รันซ้ำได้ไม่ error)
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
