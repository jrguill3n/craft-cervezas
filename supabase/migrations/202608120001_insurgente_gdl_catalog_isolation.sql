begin;

-- Add the independent Insurgente location. The Auth user/profile assignment is
-- intentionally handled in a separate manual SQL file after the Supabase Auth
-- user exists.
insert into public.locations(name, slug, active)
values ('Insurgente GDL', 'insurgente-gdl', true)
on conflict ((lower(slug))) do update
set name = excluded.name,
    active = true,
    updated_at = now();

-- A beer can only be used by the locations it is explicitly associated with.
create table if not exists public.beer_locations (
  beer_id uuid not null references public.beers(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (beer_id, location_id)
);
create index if not exists beer_locations_location_idx on public.beer_locations(location_id);

alter table public.beer_locations enable row level security;

-- Existing Craft catalogue belongs only to the existing Craft branches. Do not
-- associate legacy beers with Insurgente.
insert into public.beer_locations(beer_id, location_id)
select b.id, l.id
from public.beers b
cross join public.locations l
where l.slug in ('americana', 'chapalita', 'providencia')
on conflict do nothing;

create or replace function public.can_manage_beer(p_beer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.beer_locations bl
      where bl.beer_id = p_beer_id
        and public.can_manage_location(bl.location_id)
    );
$$;

create or replace function public.can_use_beer_at_location(p_beer_id uuid, p_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.beer_locations bl
      where bl.beer_id = p_beer_id
        and bl.location_id = p_location_id
        and public.can_manage_location(bl.location_id)
    );
$$;

create or replace function public.can_use_beer_on_tap_list(p_beer_id uuid, p_tap_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tap_lists tl
    where tl.id = p_tap_list_id
      and public.can_use_beer_at_location(p_beer_id, tl.location_id)
  );
$$;

create or replace function public.assign_beer_to_manager_locations()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;

  insert into public.beer_locations(beer_id, location_id)
  select new.id, pl.location_id
  from public.profiles p
  join public.profile_locations pl on pl.profile_id = p.id
  where p.id = auth.uid()
    and p.active
    and p.role = 'location_manager'
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists assign_beer_to_manager_locations on public.beers;
create trigger assign_beer_to_manager_locations
after insert on public.beers
for each row execute function public.assign_beer_to_manager_locations();

-- Keep the old draft RPC compatible with the catalogue-owned price model.
create or replace function public.create_draft_tap_list(p_location_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_draft uuid;
  v_published uuid;
  v_item record;
begin
  if auth.uid() is null or not public.can_manage_location(p_location_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_location_id::text, 0));

  select id into v_draft
  from public.tap_lists
  where location_id = p_location_id and status = 'draft';

  if v_draft is not null then
    return v_draft;
  end if;

  insert into public.tap_lists(location_id, status)
  values (p_location_id, 'draft')
  returning id into v_draft;

  select id into v_published
  from public.tap_lists
  where location_id = p_location_id and status = 'published';

  if v_published is not null then
    for v_item in
      select *
      from public.tap_list_items
      where tap_list_id = v_published
      order by display_order
    loop
      if not public.can_use_beer_at_location(v_item.beer_id, p_location_id) then
        raise exception 'beer is not available for this location' using errcode = '42501';
      end if;

      insert into public.tap_list_items(tap_list_id, beer_id, tap_number, badge, display_order)
      values(v_draft, v_item.beer_id, v_item.tap_number, v_item.badge, v_item.display_order);
    end loop;
  end if;

  return v_draft;
end;
$$;

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
    raise exception 'tap list contains beer outside this location catalog' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_location_id::text, 0));

  delete from public.tap_lists
  where location_id = v_location_id and status = 'published';

  update public.tap_lists
  set status = 'published',
      published_at = now(),
      published_by = auth.uid()
  where id = p_tap_list_id;
end;
$$;

drop policy if exists beer_locations_read on public.beer_locations;
drop policy if exists beer_locations_insert on public.beer_locations;
drop policy if exists beer_locations_super_admin_update on public.beer_locations;
drop policy if exists beer_locations_super_admin_delete on public.beer_locations;
drop policy if exists beers_public_read on public.beers;
drop policy if exists beers_admin_write on public.beers;
drop policy if exists beers_active_profile_insert on public.beers;
drop policy if exists beers_manager_update on public.beers;
drop policy if exists beers_manager_delete on public.beers;
drop policy if exists serving_options_public_read on public.serving_options;
drop policy if exists serving_options_manager_write on public.serving_options;
drop policy if exists serving_options_manager_insert on public.serving_options;
drop policy if exists serving_options_manager_update on public.serving_options;
drop policy if exists serving_options_manager_delete on public.serving_options;
drop policy if exists tap_list_items_manager_write on public.tap_list_items;

create policy beer_locations_read
on public.beer_locations for select
using (public.is_super_admin() or public.can_manage_location(location_id));

create policy beer_locations_insert
on public.beer_locations for insert
with check (public.is_super_admin() or public.can_manage_location(location_id));

create policy beer_locations_super_admin_update
on public.beer_locations for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy beer_locations_super_admin_delete
on public.beer_locations for delete
using (public.is_super_admin());

create policy beers_public_read
on public.beers for select
using (
  public.is_super_admin()
  or public.can_manage_beer(beers.id)
  or exists (
    select 1
    from public.tap_list_items i
    join public.tap_lists l on l.id = i.tap_list_id
    where i.beer_id = beers.id
      and l.status = 'published'
  )
);

create policy beers_active_profile_insert
on public.beers for insert
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.profiles p
    join public.profile_locations pl on pl.profile_id = p.id
    where p.id = auth.uid()
      and p.active
      and p.role = 'location_manager'
  )
);

create policy beers_manager_update
on public.beers for update
using (public.is_super_admin() or public.can_manage_beer(beers.id))
with check (public.is_super_admin() or public.can_manage_beer(beers.id));

create policy beers_manager_delete
on public.beers for delete
using (public.is_super_admin() or public.can_manage_beer(beers.id));

create policy tap_list_items_manager_write
on public.tap_list_items for all
using (
  public.can_manage_tap_list(tap_list_id)
  and exists (
    select 1
    from public.tap_lists l
    where l.id = tap_list_id and l.status = 'draft'
  )
  and public.can_use_beer_on_tap_list(beer_id, tap_list_id)
)
with check (
  public.can_manage_tap_list(tap_list_id)
  and exists (
    select 1
    from public.tap_lists l
    where l.id = tap_list_id and l.status = 'draft'
  )
  and public.can_use_beer_on_tap_list(beer_id, tap_list_id)
);

create policy serving_options_public_read
on public.serving_options for select
using (
  public.is_super_admin()
  or public.can_manage_beer(serving_options.beer_id)
  or exists (
    select 1
    from public.tap_list_items i
    join public.tap_lists l on l.id = i.tap_list_id
    where i.beer_id = serving_options.beer_id
      and l.status = 'published'
  )
);

create policy serving_options_manager_insert
on public.serving_options for insert
with check (public.is_super_admin() or public.can_manage_beer(beer_id));

create policy serving_options_manager_update
on public.serving_options for update
using (public.is_super_admin() or public.can_manage_beer(beer_id))
with check (public.is_super_admin() or public.can_manage_beer(beer_id));

create policy serving_options_manager_delete
on public.serving_options for delete
using (public.is_super_admin() or public.can_manage_beer(beer_id));

revoke all on function public.can_manage_beer(uuid) from public;
revoke all on function public.can_use_beer_at_location(uuid, uuid) from public;
revoke all on function public.can_use_beer_on_tap_list(uuid, uuid) from public;
revoke all on function public.assign_beer_to_manager_locations() from public;

grant execute on function public.can_manage_beer(uuid) to anon, authenticated;
grant execute on function public.can_use_beer_at_location(uuid, uuid) to anon, authenticated;
grant execute on function public.can_use_beer_on_tap_list(uuid, uuid) to anon, authenticated;

grant select on public.beer_locations to anon;
grant select, insert, update, delete on public.beer_locations to authenticated;

commit;
