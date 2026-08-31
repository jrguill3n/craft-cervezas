begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.club_member_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.points_transaction_type as enum ('earn', 'redeem', 'adjustment', 'expiration');
exception when duplicate_object then null; end $$;

create or replace function public.is_club_craft_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      join public.profile_locations pl on pl.profile_id = p.id
      join public.locations l on l.id = pl.location_id
      where p.id = auth.uid()
        and p.active
        and p.role = 'location_manager'
        and l.active
        and l.slug in ('americana', 'chapalita', 'providencia')
    );
$$;

create or replace function public.generate_club_member_code()
returns text
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_code text;
begin
  loop
    v_code := 'CC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.club_members where member_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  member_code text not null default public.generate_club_member_code(),
  first_name text not null,
  last_name text,
  phone text not null,
  email text,
  birth_date date,
  points_balance integer not null default 0,
  status public.club_member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz,
  constraint club_members_member_code_not_blank check (btrim(member_code) <> ''),
  constraint club_members_first_name_not_blank check (btrim(first_name) <> ''),
  constraint club_members_phone_not_blank check (btrim(phone) <> ''),
  constraint club_members_points_balance_nonnegative check (points_balance >= 0)
);

create unique index if not exists club_members_member_code_unique
  on public.club_members(member_code);

create unique index if not exists club_members_phone_unique
  on public.club_members(phone);

create index if not exists club_members_name_search_idx
  on public.club_members(lower(first_name), lower(last_name));

create index if not exists club_members_email_idx
  on public.club_members(lower(email))
  where email is not null;

create index if not exists club_members_status_idx
  on public.club_members(status);

create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club_members(id) on delete restrict,
  transaction_type public.points_transaction_type not null,
  points integer not null,
  balance_after integer not null,
  reference_type text,
  reference_id text,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint points_transactions_points_not_zero check (points <> 0),
  constraint points_transactions_balance_after_nonnegative check (balance_after >= 0)
);

create index if not exists points_transactions_member_created_idx
  on public.points_transactions(member_id, created_at desc);

create index if not exists points_transactions_type_idx
  on public.points_transactions(transaction_type);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost integer not null,
  image_url text,
  active boolean not null default true,
  stock_optional integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rewards_name_not_blank check (btrim(name) <> ''),
  constraint rewards_points_cost_positive check (points_cost > 0),
  constraint rewards_stock_optional_nonnegative check (stock_optional is null or stock_optional >= 0)
);

create index if not exists rewards_active_points_idx
  on public.rewards(active, points_cost);

drop trigger if exists set_club_members_updated_at on public.club_members;
create trigger set_club_members_updated_at
before update on public.club_members
for each row execute function public.set_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at
before update on public.rewards
for each row execute function public.set_updated_at();

alter table public.club_members enable row level security;
alter table public.points_transactions enable row level security;
alter table public.rewards enable row level security;

grant execute on function public.is_club_craft_admin() to authenticated;
grant execute on function public.generate_club_member_code() to authenticated;

drop policy if exists club_members_admin_read on public.club_members;
drop policy if exists club_members_admin_insert on public.club_members;
drop policy if exists club_members_admin_update on public.club_members;
drop policy if exists points_transactions_admin_read on public.points_transactions;
drop policy if exists points_transactions_admin_insert on public.points_transactions;
drop policy if exists rewards_admin_read on public.rewards;
drop policy if exists rewards_admin_insert on public.rewards;
drop policy if exists rewards_admin_update on public.rewards;
drop policy if exists rewards_admin_delete on public.rewards;

create policy club_members_admin_read
on public.club_members for select
to authenticated
using (public.is_club_craft_admin());

create policy club_members_admin_insert
on public.club_members for insert
to authenticated
with check (public.is_club_craft_admin());

create policy club_members_admin_update
on public.club_members for update
to authenticated
using (public.is_club_craft_admin())
with check (public.is_club_craft_admin());

create policy points_transactions_admin_read
on public.points_transactions for select
to authenticated
using (public.is_club_craft_admin());

create policy points_transactions_admin_insert
on public.points_transactions for insert
to authenticated
with check (public.is_club_craft_admin());

create policy rewards_admin_read
on public.rewards for select
to authenticated
using (public.is_club_craft_admin());

create policy rewards_admin_insert
on public.rewards for insert
to authenticated
with check (public.is_club_craft_admin());

create policy rewards_admin_update
on public.rewards for update
to authenticated
using (public.is_club_craft_admin())
with check (public.is_club_craft_admin());

create policy rewards_admin_delete
on public.rewards for delete
to authenticated
using (public.is_club_craft_admin());

grant select, insert, update on public.club_members to authenticated;
grant select, insert on public.points_transactions to authenticated;
grant select, insert, update, delete on public.rewards to authenticated;

with seed(name, points_cost) as (
  values
    ('Craft Glass', 100),
    ('Craft Goblet', 150),
    ('Selected IPA Can', 200),
    ('Craft T-Shirt', 400),
    ('Special Bottle', 750)
)
insert into public.rewards(name, points_cost, active)
select seed.name, seed.points_cost, true
from seed
where not exists (
  select 1
  from public.rewards r
  where lower(r.name) = lower(seed.name)
);

commit;
