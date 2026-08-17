begin;

-- Keep Insurgente isolated from the Craft super admin. Super admins can manage
-- the three Craft locations by default; any non-Craft location must be assigned
-- explicitly through profile_locations.
create or replace function public.can_manage_location(p_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.locations l on l.id = p_location_id
    left join public.profile_locations pl
      on pl.profile_id = p.id
      and pl.location_id = p_location_id
    where p.id = auth.uid()
      and p.active
      and (
        (
          p.role = 'super_admin'
          and (
            l.slug in ('americana', 'chapalita', 'providencia')
            or pl.location_id is not null
          )
        )
        or (
          p.role = 'location_manager'
          and pl.location_id is not null
        )
      )
  );
$$;

create or replace function public.can_manage_beer(p_beer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
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
  select exists (
    select 1
    from public.beer_locations bl
    where bl.beer_id = p_beer_id
      and bl.location_id = p_location_id
      and public.can_manage_location(bl.location_id)
  );
$$;

create or replace function public.assign_beer_to_manager_locations()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  insert into public.beer_locations(beer_id, location_id)
  select new.id, l.id
  from public.locations l
  where l.active
    and public.can_manage_location(l.id)
  on conflict do nothing;

  return new;
end;
$$;

drop policy if exists beer_locations_read on public.beer_locations;
drop policy if exists beer_locations_insert on public.beer_locations;
drop policy if exists beer_locations_super_admin_update on public.beer_locations;
drop policy if exists beer_locations_super_admin_delete on public.beer_locations;
drop policy if exists beers_public_read on public.beers;
drop policy if exists beers_active_profile_insert on public.beers;
drop policy if exists beers_manager_update on public.beers;
drop policy if exists beers_manager_delete on public.beers;
drop policy if exists serving_options_public_read on public.serving_options;
drop policy if exists serving_options_manager_insert on public.serving_options;
drop policy if exists serving_options_manager_update on public.serving_options;
drop policy if exists serving_options_manager_delete on public.serving_options;

create policy beer_locations_read
on public.beer_locations for select
using (public.can_manage_location(location_id));

create policy beer_locations_insert
on public.beer_locations for insert
with check (public.can_manage_location(location_id));

create policy beer_locations_super_admin_update
on public.beer_locations for update
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy beer_locations_super_admin_delete
on public.beer_locations for delete
using (public.can_manage_location(location_id));

create policy beers_public_read
on public.beers for select
using (
  public.can_manage_beer(beers.id)
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
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active
      and p.role in ('super_admin', 'location_manager')
  )
);

create policy beers_manager_update
on public.beers for update
using (public.can_manage_beer(beers.id))
with check (public.can_manage_beer(beers.id));

create policy beers_manager_delete
on public.beers for delete
using (public.can_manage_beer(beers.id));

create policy serving_options_public_read
on public.serving_options for select
using (
  public.can_manage_beer(serving_options.beer_id)
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
with check (public.can_manage_beer(beer_id));

create policy serving_options_manager_update
on public.serving_options for update
using (public.can_manage_beer(beer_id))
with check (public.can_manage_beer(beer_id));

create policy serving_options_manager_delete
on public.serving_options for delete
using (public.can_manage_beer(beer_id));

revoke all on function public.can_manage_location(uuid) from public;
revoke all on function public.can_manage_beer(uuid) from public;
revoke all on function public.can_use_beer_at_location(uuid, uuid) from public;
revoke all on function public.assign_beer_to_manager_locations() from public;

grant execute on function public.can_manage_location(uuid) to anon, authenticated;
grant execute on function public.can_manage_beer(uuid) to anon, authenticated;
grant execute on function public.can_use_beer_at_location(uuid, uuid) to anon, authenticated;

commit;

