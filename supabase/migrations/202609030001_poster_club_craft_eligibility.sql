begin;

create table if not exists public.poster_category_point_rates (
  id uuid primary key default gen_random_uuid(),
  poster_category_id text not null,
  poster_category_name text not null,
  parent_category_id text,
  root_category_id text not null,
  root_category_name text not null,
  points_rate numeric(6, 5) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint poster_category_point_rates_category_unique unique (poster_category_id),
  constraint poster_category_point_rates_category_not_blank check (btrim(poster_category_id) <> ''),
  constraint poster_category_point_rates_name_not_blank check (btrim(poster_category_name) <> ''),
  constraint poster_category_point_rates_root_not_blank check (btrim(root_category_id) <> ''),
  constraint poster_category_point_rates_rate_valid check (points_rate >= 0 and points_rate <= 1)
);

create index if not exists poster_category_point_rates_root_idx
  on public.poster_category_point_rates(root_category_id)
  where active = true;

drop trigger if exists set_poster_category_point_rates_updated_at on public.poster_category_point_rates;
create trigger set_poster_category_point_rates_updated_at
before update on public.poster_category_point_rates
for each row execute function public.set_updated_at();

alter table public.poster_category_point_rates enable row level security;

drop policy if exists poster_category_point_rates_admin_read on public.poster_category_point_rates;
drop policy if exists poster_category_point_rates_admin_write on public.poster_category_point_rates;

create policy poster_category_point_rates_admin_read
on public.poster_category_point_rates for select
to authenticated
using (public.is_club_craft_admin());

create policy poster_category_point_rates_admin_write
on public.poster_category_point_rates for all
to authenticated
using (public.is_club_craft_admin())
with check (public.is_club_craft_admin());

grant select, insert, update, delete on public.poster_category_point_rates to authenticated;

insert into public.poster_category_point_rates (
  poster_category_id,
  poster_category_name,
  parent_category_id,
  root_category_id,
  root_category_name,
  points_rate,
  active
)
values
  ('9', 'TAP', null, '9', 'TAP', 0.05000, true),
  ('8', 'NACIONAL', null, '8', 'NACIONAL', 0.05000, true),
  ('11', 'IMPORTADO', null, '11', 'IMPORTADO', 0.05000, true),
  ('7', 'LOCAL', null, '7', 'LOCAL', 0.05000, true),
  ('227', '4 Packs', null, '227', '4 Packs', 0.02500, true)
on conflict (poster_category_id) do update
set poster_category_name = excluded.poster_category_name,
    parent_category_id = excluded.parent_category_id,
    root_category_id = excluded.root_category_id,
    root_category_name = excluded.root_category_name,
    points_rate = excluded.points_rate,
    active = excluded.active;

commit;
