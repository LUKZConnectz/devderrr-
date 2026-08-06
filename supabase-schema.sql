-- ========================================================================
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

-- เปิดใช้งาน Realtime สำหรับตารางที่ต้องการให้อัปเดตทันที (เช่น admin เห็นสลิปใหม่)
alter publication supabase_realtime add table
  public.app_users,
  public.app_topups,
  public.app_orders,
  public.app_products,
  public.app_donations;
