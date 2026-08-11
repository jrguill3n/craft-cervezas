create extension if not exists pgcrypto;

create type public.profile_role as enum ('super_admin', 'location_manager');
create type public.tap_list_status as enum ('draft', 'published');
create type public.availability_status as enum ('available', 'unavailable');
create type public.tap_badge as enum ('new', 'limited', 'guest', 'house');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.profile_role not null default 'location_manager',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_locations (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (profile_id, location_id)
);

create table public.beers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brewery text not null,
  style text not null,
  abv numeric(4,2) not null check (abv >= 0 and abv <= 100),
  default_price numeric(10,2) not null check (default_price > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tap_lists (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  status public.tap_list_status not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tap_lists_one_draft_per_location
  on public.tap_lists(location_id) where status = 'draft';
create unique index tap_lists_one_published_per_location
  on public.tap_lists(location_id) where status = 'published';

create table public.tap_list_items (
  id uuid primary key default gen_random_uuid(),
  tap_list_id uuid not null references public.tap_lists(id) on delete cascade,
  beer_id uuid not null references public.beers(id) on delete restrict,
  tap_number integer check (tap_number is null or tap_number > 0),
  availability_status public.availability_status not null default 'available',
  badge public.tap_badge,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tap_list_id, beer_id),
  unique (tap_list_id, tap_number)
);

create table public.serving_options (
  id uuid primary key default gen_random_uuid(),
  tap_list_item_id uuid not null references public.tap_list_items(id) on delete cascade,
  label text not null,
  size text not null,
  price numeric(10,2) not null check (price > 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tap_lists_location_status_idx on public.tap_lists(location_id, status);
create index tap_list_items_list_order_idx on public.tap_list_items(tap_list_id, display_order);
create index serving_options_item_order_idx on public.serving_options(tap_list_item_id, display_order);

create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.can_manage_location(p_location_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active and (
      p.role = 'super_admin' or exists (
        select 1 from public.profile_locations pl
        where pl.profile_id = p.id and pl.location_id = p_location_id
      )
    )
  );
$$;

create or replace function public.create_draft_tap_list(p_location_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_draft_id uuid;
  v_published_id uuid;
  v_new_item_id uuid;
  r_item record;
begin
  if not public.can_manage_location(p_location_id) then raise exception 'Not authorized'; end if;
  select id into v_draft_id from public.tap_lists where location_id = p_location_id and status = 'draft';
  if v_draft_id is not null then return v_draft_id; end if;

  insert into public.tap_lists(location_id, status) values (p_location_id, 'draft') returning id into v_draft_id;
  select id into v_published_id from public.tap_lists where location_id = p_location_id and status = 'published';

  for r_item in select * from public.tap_list_items where tap_list_id = v_published_id order by display_order loop
    insert into public.tap_list_items(tap_list_id, beer_id, tap_number, availability_status, badge, display_order)
    values (v_draft_id, r_item.beer_id, r_item.tap_number, r_item.availability_status, r_item.badge, r_item.display_order)
    returning id into v_new_item_id;
    insert into public.serving_options(tap_list_item_id, label, size, price, display_order)
      select v_new_item_id, label, size, price, display_order
      from public.serving_options where tap_list_item_id = r_item.id;
  end loop;
  return v_draft_id;
end;
$$;

create or replace function public.publish_tap_list(p_tap_list_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_location_id uuid;
begin
  select location_id into v_location_id from public.tap_lists where id = p_tap_list_id and status = 'draft' for update;
  if v_location_id is null then raise exception 'Draft tap list not found'; end if;
  if auth.uid() is distinct from p_user_id or not public.can_manage_location(v_location_id) then raise exception 'Not authorized'; end if;
  if exists (
    select 1 from public.tap_list_items i
    where i.tap_list_id = p_tap_list_id and not exists (
      select 1 from public.serving_options s where s.tap_list_item_id = i.id and s.price > 0
    )
  ) then raise exception 'Every beer must have a price'; end if;

  delete from public.tap_lists where location_id = v_location_id and status = 'published';
  update public.tap_lists set status = 'published', published_at = now(), published_by = p_user_id, updated_at = now()
  where id = p_tap_list_id;
end;
$$;

alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.beers enable row level security;
alter table public.tap_lists enable row level security;
alter table public.tap_list_items enable row level security;
alter table public.serving_options enable row level security;

create policy locations_public_read on public.locations for select using (active or public.can_manage_location(id));
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_active_admin());
create policy profile_locations_admin_read on public.profile_locations for select using (public.is_active_admin());
create policy beers_public_read on public.beers for select using (
  public.is_active_admin() or exists (
    select 1 from public.tap_list_items i join public.tap_lists t on t.id = i.tap_list_id
    where i.beer_id = beers.id and t.status = 'published'
  )
);
create policy beers_admin_all on public.beers for all using (public.is_active_admin()) with check (public.is_active_admin());
create policy tap_lists_read on public.tap_lists for select using (status = 'published' or public.can_manage_location(location_id));
create policy tap_lists_admin_all on public.tap_lists for all using (public.can_manage_location(location_id)) with check (public.can_manage_location(location_id));
create policy tap_items_read on public.tap_list_items for select using (
  exists (select 1 from public.tap_lists t where t.id = tap_list_id and (t.status = 'published' or public.can_manage_location(t.location_id)))
);
create policy tap_items_admin_all on public.tap_list_items for all using (
  exists (select 1 from public.tap_lists t where t.id = tap_list_id and t.status = 'draft' and public.can_manage_location(t.location_id))
) with check (
  exists (select 1 from public.tap_lists t where t.id = tap_list_id and t.status = 'draft' and public.can_manage_location(t.location_id))
);
create policy serving_options_read on public.serving_options for select using (
  exists (
    select 1 from public.tap_list_items i join public.tap_lists t on t.id = i.tap_list_id
    where i.id = tap_list_item_id and (t.status = 'published' or public.can_manage_location(t.location_id))
  )
);
create policy serving_options_admin_all on public.serving_options for all using (
  exists (
    select 1 from public.tap_list_items i join public.tap_lists t on t.id = i.tap_list_id
    where i.id = tap_list_item_id and t.status = 'draft' and public.can_manage_location(t.location_id)
  )
) with check (
  exists (
    select 1 from public.tap_list_items i join public.tap_lists t on t.id = i.tap_list_id
    where i.id = tap_list_item_id and t.status = 'draft' and public.can_manage_location(t.location_id)
  )
);

insert into public.locations(name, slug) values
  ('Providencia', 'providencia'),
  ('Americana', 'americana'),
  ('Chapalita', 'chapalita')
on conflict (slug) do update set name = excluded.name, active = true;
