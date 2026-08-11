begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'location_manager');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.tap_list_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.tap_item_badge as enum ('new', 'limited', 'guest', 'house');
exception when duplicate_object then null; end $$;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_name_not_blank check (btrim(name) <> ''),
  constraint locations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
create unique index if not exists locations_slug_unique on public.locations (lower(slug));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'location_manager',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_locations (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, location_id)
);
create index if not exists profile_locations_location_idx on public.profile_locations(location_id);

create table if not exists public.beers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brewery text not null,
  style text not null,
  abv numeric(4,2) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beers_name_not_blank check (btrim(name) <> ''),
  constraint beers_brewery_not_blank check (btrim(brewery) <> ''),
  constraint beers_style_not_blank check (btrim(style) <> ''),
  constraint beers_abv_range check (abv >= 0 and abv <= 100)
);
create index if not exists beers_name_idx on public.beers(lower(name));

create table if not exists public.tap_lists (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  status public.tap_list_status not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tap_lists_publication_fields check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);
create index if not exists tap_lists_location_status_idx on public.tap_lists(location_id, status);
create unique index if not exists tap_lists_one_published_per_location
  on public.tap_lists(location_id) where status = 'published';
create unique index if not exists tap_lists_one_draft_per_location
  on public.tap_lists(location_id) where status = 'draft';

create table if not exists public.tap_list_items (
  id uuid primary key default gen_random_uuid(),
  tap_list_id uuid not null references public.tap_lists(id) on delete cascade,
  beer_id uuid not null references public.beers(id) on delete restrict,
  tap_number integer,
  badge public.tap_item_badge,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tap_list_items_tap_number_range check (tap_number is null or tap_number between 1 and 99),
  constraint tap_list_items_display_order_nonnegative check (display_order >= 0),
  unique (tap_list_id, beer_id),
  unique (tap_list_id, tap_number)
);
create index if not exists tap_list_items_list_order_idx on public.tap_list_items(tap_list_id, display_order);
create index if not exists tap_list_items_beer_idx on public.tap_list_items(beer_id);
alter table public.tap_list_items drop column if exists availability_status;
drop type if exists public.tap_item_availability;

create table if not exists public.serving_options (
  id uuid primary key default gen_random_uuid(),
  tap_list_item_id uuid references public.tap_list_items(id) on delete cascade,
  beer_id uuid references public.beers(id) on delete cascade,
  label text not null,
  size text not null,
  price numeric(10,2) not null,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint serving_options_exactly_one_owner check (num_nonnulls(tap_list_item_id, beer_id) = 1),
  constraint serving_options_label_not_blank check (btrim(label) <> ''),
  constraint serving_options_size_not_blank check (btrim(size) <> ''),
  constraint serving_options_price_mxn_nonnegative check (price >= 0),
  constraint serving_options_display_order_positive check (display_order >= 1)
);

-- Upgrade the original item-only serving_options table in place. PostgreSQL's
-- CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
alter table public.serving_options
  add column if not exists beer_id uuid references public.beers(id) on delete cascade;

do $$ begin
  alter table public.serving_options
    add constraint serving_options_exactly_one_owner
    check (num_nonnulls(tap_list_item_id, beer_id) = 1);
exception when duplicate_object then null; end $$;

create index if not exists serving_options_item_order_idx on public.serving_options(tap_list_item_id, display_order);
create index if not exists serving_options_beer_order_idx on public.serving_options(beer_id, display_order);

-- Older installs allowed multiple presentation prices. Keep the primary row
-- before enforcing the single pint price used by the application.
delete from public.serving_options so
using public.serving_options keep
where so.tap_list_item_id is not null
  and so.tap_list_item_id = keep.tap_list_item_id
  and (so.display_order, so.created_at, so.id) > (keep.display_order, keep.created_at, keep.id);
delete from public.serving_options so
using public.serving_options keep
where so.beer_id is not null
  and so.beer_id = keep.beer_id
  and (so.display_order, so.created_at, so.id) > (keep.display_order, keep.created_at, keep.id);

create unique index if not exists serving_options_item_order_unique
  on public.serving_options(tap_list_item_id, display_order) where tap_list_item_id is not null;
create unique index if not exists serving_options_beer_order_unique
  on public.serving_options(beer_id, display_order) where beer_id is not null;
create unique index if not exists serving_options_one_per_item
  on public.serving_options(tap_list_item_id) where tap_list_item_id is not null;
create unique index if not exists serving_options_one_per_beer
  on public.serving_options(beer_id) where beer_id is not null;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['locations','profiles','beers','tap_lists','tap_list_items','serving_options'] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active and role = 'super_admin');
$$;

create or replace function public.can_manage_location(p_location_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select public.is_super_admin() or exists(
    select 1 from public.profiles p
    join public.profile_locations pl on pl.profile_id = p.id
    where p.id = auth.uid() and p.active and p.role = 'location_manager' and pl.location_id = p_location_id
  );
$$;

create or replace function public.can_manage_tap_list(p_tap_list_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.tap_lists tl where tl.id = p_tap_list_id and public.can_manage_location(tl.location_id));
$$;

create or replace function public.create_draft_tap_list(p_location_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_draft uuid; v_published uuid; v_item record; v_new_item uuid;
begin
  if auth.uid() is null or not public.can_manage_location(p_location_id) then raise exception 'not authorized' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_location_id::text, 0));
  select id into v_draft from public.tap_lists where location_id = p_location_id and status = 'draft';
  if v_draft is not null then return v_draft; end if;
  insert into public.tap_lists(location_id, status) values (p_location_id, 'draft') returning id into v_draft;
  select id into v_published from public.tap_lists where location_id = p_location_id and status = 'published';
  if v_published is not null then
    for v_item in select * from public.tap_list_items where tap_list_id = v_published order by display_order loop
      insert into public.tap_list_items(tap_list_id, beer_id, tap_number, badge, display_order)
      values(v_draft, v_item.beer_id, v_item.tap_number, v_item.badge, v_item.display_order)
      returning id into v_new_item;
      insert into public.serving_options(tap_list_item_id, label, size, price, display_order)
      select v_new_item, label, size, price, display_order from public.serving_options where tap_list_item_id = v_item.id;
    end loop;
  end if;
  return v_draft;
end; $$;

create or replace function public.publish_tap_list(p_tap_list_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_location_id uuid;
begin
  select location_id into v_location_id from public.tap_lists where id = p_tap_list_id and status = 'draft' for update;
  if v_location_id is null then raise exception 'draft tap list not found'; end if;
  if auth.uid() is null or not public.can_manage_location(v_location_id) then raise exception 'not authorized' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_location_id::text, 0));
  delete from public.tap_lists where location_id = v_location_id and status = 'published';
  update public.tap_lists set status = 'published', published_at = now(), published_by = auth.uid() where id = p_tap_list_id;
end; $$;

alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.beers enable row level security;
alter table public.tap_lists enable row level security;
alter table public.tap_list_items enable row level security;
alter table public.serving_options enable row level security;

do $$ declare pol record; begin
  for pol in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename in ('locations','profiles','profile_locations','beers','tap_lists','tap_list_items','serving_options') loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create policy locations_public_read on public.locations for select using (active or public.can_manage_location(id));
create policy locations_super_admin_write on public.locations for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_super_admin());
create policy profiles_super_admin_write on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy profile_locations_member_read on public.profile_locations for select using (profile_id = auth.uid() or public.is_super_admin());
create policy profile_locations_super_admin_write on public.profile_locations for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy beers_public_read on public.beers for select using (
  public.is_super_admin() or exists(select 1 from public.tap_list_items i join public.tap_lists l on l.id=i.tap_list_id where i.beer_id=beers.id and l.status='published')
  or exists(select 1 from public.profile_locations pl join public.profiles p on p.id=pl.profile_id where p.id=auth.uid() and p.active)
);
create policy beers_admin_write on public.beers for all using (public.is_super_admin() or exists(select 1 from public.profiles where id=auth.uid() and active)) with check (public.is_super_admin() or exists(select 1 from public.profiles where id=auth.uid() and active));
create policy tap_lists_public_read on public.tap_lists for select using (status='published' or public.can_manage_location(location_id));
create policy tap_lists_manager_write on public.tap_lists for all using (public.can_manage_location(location_id) and status='draft') with check (public.can_manage_location(location_id) and status='draft');
create policy tap_list_items_public_read on public.tap_list_items for select using (exists(select 1 from public.tap_lists l where l.id=tap_list_id and (l.status='published' or public.can_manage_location(l.location_id))));
create policy tap_list_items_manager_write on public.tap_list_items for all using (public.can_manage_tap_list(tap_list_id) and exists(select 1 from public.tap_lists l where l.id=tap_list_id and l.status='draft')) with check (public.can_manage_tap_list(tap_list_id) and exists(select 1 from public.tap_lists l where l.id=tap_list_id and l.status='draft'));
create policy serving_options_public_read on public.serving_options for select using (
  (tap_list_item_id is not null and exists(select 1 from public.tap_list_items i join public.tap_lists l on l.id=i.tap_list_id where i.id=tap_list_item_id and (l.status='published' or public.can_manage_location(l.location_id))))
  or (beer_id is not null and exists(select 1 from public.profiles where id=auth.uid() and active))
);
create policy serving_options_manager_write on public.serving_options for all using (
  public.is_super_admin() or (tap_list_item_id is not null and exists(select 1 from public.tap_list_items i join public.tap_lists l on l.id=i.tap_list_id where i.id=tap_list_item_id and l.status='draft' and public.can_manage_location(l.location_id))) or (beer_id is not null and exists(select 1 from public.profiles where id=auth.uid() and active))
) with check (
  public.is_super_admin() or (tap_list_item_id is not null and exists(select 1 from public.tap_list_items i join public.tap_lists l on l.id=i.tap_list_id where i.id=tap_list_item_id and l.status='draft' and public.can_manage_location(l.location_id))) or (beer_id is not null and exists(select 1 from public.profiles where id=auth.uid() and active))
);

revoke all on function public.is_super_admin() from public;
revoke all on function public.can_manage_location(uuid) from public;
revoke all on function public.can_manage_tap_list(uuid) from public;
revoke all on function public.create_draft_tap_list(uuid) from public;
revoke all on function public.publish_tap_list(uuid) from public;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.can_manage_location(uuid) to anon, authenticated;
grant execute on function public.can_manage_tap_list(uuid) to anon, authenticated;
grant execute on function public.create_draft_tap_list(uuid) to authenticated;
grant execute on function public.publish_tap_list(uuid) to authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.locations, public.beers, public.tap_lists, public.tap_list_items, public.serving_options to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.locations(name, slug, active) values
  ('Providencia', 'providencia', true),
  ('Americana', 'americana', true),
  ('Chapalita', 'chapalita', true)
on conflict ((lower(slug))) do update set name=excluded.name, active=true, updated_at=now();

commit;
