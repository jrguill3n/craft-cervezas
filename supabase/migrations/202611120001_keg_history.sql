begin;

create table if not exists public.keg_connections (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  tap_number integer not null,
  beer_id uuid not null references public.beers(id) on delete restrict,
  connected_at timestamptz not null default now(),
  connected_by uuid references public.profiles(id) on delete set null,
  disconnected_at timestamptz,
  disconnected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint keg_connections_tap_number_range check (tap_number between 1 and 99),
  constraint keg_connections_disconnection_fields check (
    (disconnected_at is null and disconnected_by is null)
    or (disconnected_at is not null and disconnected_at >= connected_at)
  )
);

create unique index if not exists keg_connections_one_open_per_tap
  on public.keg_connections(location_id, tap_number)
  where disconnected_at is null;

create index if not exists keg_connections_location_connected_idx
  on public.keg_connections(location_id, connected_at desc);

create index if not exists keg_connections_beer_connected_idx
  on public.keg_connections(beer_id, connected_at desc);

alter table public.keg_connections enable row level security;

drop policy if exists keg_connections_manager_read on public.keg_connections;
create policy keg_connections_manager_read
on public.keg_connections for select
to authenticated
using (public.can_manage_location(location_id));

-- Managers need the display name of colleagues who performed a movement in
-- one of their locations. This does not grant access to Auth user records.
drop policy if exists profiles_keg_history_actor_read on public.profiles;
create policy profiles_keg_history_actor_read
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.keg_connections kc
    where (kc.connected_by = profiles.id or kc.disconnected_by = profiles.id)
      and public.can_manage_location(kc.location_id)
  )
);

grant select on public.keg_connections to authenticated;

-- Seed the currently published state. Earlier publication times are not
-- recoverable because the previous workflow deleted replaced tap lists.
insert into public.keg_connections (
  location_id,
  tap_number,
  beer_id,
  connected_at,
  connected_by
)
select
  tl.location_id,
  i.tap_number,
  i.beer_id,
  coalesce(tl.published_at, tl.created_at),
  tl.published_by
from public.tap_lists tl
join public.tap_list_items i on i.tap_list_id = tl.id
where tl.status = 'published'
  and i.tap_number is not null
  and not exists (
    select 1
    from public.keg_connections kc
    where kc.location_id = tl.location_id
      and kc.tap_number = i.tap_number
      and kc.disconnected_at is null
  );

create or replace function public.protect_keg_connections_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if coalesce(current_setting('app.keg_history_write', true), '') <> 'on' then
    raise exception 'El historial de barriles solo puede modificarse al publicar un Tap List.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    raise exception 'El historial de barriles no se puede eliminar.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    old.location_id is distinct from new.location_id
    or old.tap_number is distinct from new.tap_number
    or old.beer_id is distinct from new.beer_id
    or old.connected_at is distinct from new.connected_at
    or old.connected_by is distinct from new.connected_by
    or old.created_at is distinct from new.created_at
    or old.disconnected_at is not null
  ) then
    raise exception 'Los movimientos históricos de barriles son inmutables.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_keg_connections_audit on public.keg_connections;
create trigger protect_keg_connections_audit
before insert or update or delete on public.keg_connections
for each row execute function public.protect_keg_connections_audit();

create or replace function public.publish_tap_list(p_tap_list_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_location_id uuid;
begin
  select location_id into v_location_id
  from public.tap_lists
  where id = p_tap_list_id and status = 'draft'
  for update;

  if v_location_id is null then
    raise exception 'draft tap list not found';
  end if;

  if auth.uid() is null or not public.can_manage_location(v_location_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.tap_list_items i
    where i.tap_list_id = p_tap_list_id
      and not public.can_use_beer_at_location(i.beer_id, v_location_id)
  ) then
    raise exception 'tap list contains beer outside this location catalog'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_location_id::text, 0));
  perform set_config('app.keg_history_write', 'on', true);

  -- End removed or replaced connections. Unchanged beer/tap pairs remain open.
  update public.keg_connections kc
  set disconnected_at = now(),
      disconnected_by = auth.uid()
  where kc.location_id = v_location_id
    and kc.disconnected_at is null
    and not exists (
      select 1
      from public.tap_list_items i
      where i.tap_list_id = p_tap_list_id
        and i.tap_number = kc.tap_number
        and i.beer_id = kc.beer_id
    );

  -- Start newly added or replaced connections.
  insert into public.keg_connections (
    location_id,
    tap_number,
    beer_id,
    connected_at,
    connected_by
  )
  select
    v_location_id,
    i.tap_number,
    i.beer_id,
    now(),
    auth.uid()
  from public.tap_list_items i
  where i.tap_list_id = p_tap_list_id
    and i.tap_number is not null
    and not exists (
      select 1
      from public.keg_connections kc
      where kc.location_id = v_location_id
        and kc.tap_number = i.tap_number
        and kc.beer_id = i.beer_id
        and kc.disconnected_at is null
    );

  delete from public.tap_lists
  where location_id = v_location_id
    and status = 'published';

  update public.tap_lists
  set status = 'published',
      published_at = now(),
      published_by = auth.uid()
  where id = p_tap_list_id;
end;
$$;

revoke all on function public.protect_keg_connections_audit() from public, anon, authenticated;
revoke all on function public.publish_tap_list(uuid) from public, anon;
grant execute on function public.publish_tap_list(uuid) to authenticated;

commit;
