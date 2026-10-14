-- Supabase schema v2 — quét mỗi giờ (Render, 0đ)
-- Chạy 1 lần trong Supabase > SQL Editor. Chạy lại an toàn (IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- 1. Lớp học (map với nhóm Tammi)
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  group_id text unique not null,          -- id nhóm ZIM, vd 1789660431071
  class_name text not null,               -- vd "Chi đoàn 12a6"
  total_students int not null default 0,  -- SĨ SỐ do bạn tự nhập trên web
  created_at timestamptz default now()
);

-- 2. Snapshot mỗi giờ mỗi lớp (tin TRƯƠNG KHẮC NAM trong ngày)
create table if not exists snapshots_hourly (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  date date not null,                     -- vd 2026-10-14
  hour int not null,                      -- 0-23, giờ chốt snapshot
  message_id text,                        -- msgID tin được chấm
  message_time timestamptz,
  reaction_count int not null default 0,  -- totalCount app báo (mã 71)
  interacted_count int not null default 0,-- unique đã trừ exclude
  created_at timestamptz default now(),
  unique (class_id, date, hour)
);

-- 3. Loại trừ (không đếm) — tự nhập trên web. class_id null = toàn trường.
create table if not exists excluded_users (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  user_id text,            -- zegoId chính xác nhất
  name_match text,         -- hoặc khớp tên chứa chuỗi này
  reason text,
  created_at timestamptz default now()
);

-- 4. Kho token xoay vòng (Render đọc lúc boot, ghi sau mỗi refresh).
-- Chỉ service_role được đọc/ghi — KHÔNG mở public cho bảng này.
create table if not exists service_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 5. Nhịp tim mỗi lần quét (dashboard + UptimeRobot canh: quá 2h không có là báo động)
create table if not exists heartbeat (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz default now(),
  status text not null default 'ok',      -- ok | auth_dead | error
  detail text
);

alter table classes enable row level security;
alter table snapshots_hourly enable row level security;
alter table excluded_users enable row level security;
alter table service_state enable row level security;
alter table heartbeat enable row level security;

-- MVP: public đọc+ghi 3 bảng nghiệp vụ để web tĩnh chạy ngay (siết Auth sau).
drop policy if exists "public read classes" on classes;
create policy "public read classes" on classes for select using (true);
drop policy if exists "public write classes" on classes;
create policy "public write classes" on classes for all using (true) with check (true);

drop policy if exists "public read snapshots" on snapshots_hourly;
create policy "public read snapshots" on snapshots_hourly for select using (true);
drop policy if exists "public write snapshots" on snapshots_hourly;
create policy "public write snapshots" on snapshots_hourly for all using (true) with check (true);

drop policy if exists "public read excluded" on excluded_users;
create policy "public read excluded" on excluded_users for select using (true);
drop policy if exists "public write excluded" on excluded_users;
create policy "public write excluded" on excluded_users for all using (true) with check (true);

drop policy if exists "public read heartbeat" on heartbeat;
create policy "public read heartbeat" on heartbeat for select using (true);
drop policy if exists "public write heartbeat" on heartbeat;
create policy "public write heartbeat" on heartbeat for all using (true) with check (true);

-- service_state: KHÔNG tạo policy public → chỉ service_role (bypass RLS) chạm được.

-- Seed lớp test
insert into classes (group_id, class_name, total_students)
values ('1789660431071', 'Chi đoàn 12a6', 43)
on conflict (group_id) do nothing;
