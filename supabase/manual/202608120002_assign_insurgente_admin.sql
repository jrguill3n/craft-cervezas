-- Run this manually in the Supabase Dashboard SQL Editor only AFTER creating
-- the Auth user in Supabase Authentication:
--
--   email: insurgente@craftcervezas.com
--
-- Do not paste or store the password in SQL.

begin;

insert into public.locations(name, slug, active)
values ('Insurgente GDL', 'insurgente-gdl', true)
on conflict ((lower(slug))) do update
set name = excluded.name,
    active = true,
    updated_at = now();

do $$
declare
  v_user_id uuid;
  v_location_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = lower('insurgente@craftcervezas.com')
  limit 1;

  if v_user_id is null then
    raise exception 'Create the Supabase Auth user insurgente@craftcervezas.com before running this SQL.';
  end if;

  select id
  into v_location_id
  from public.locations
  where slug = 'insurgente-gdl';

  if v_location_id is null then
    raise exception 'Location insurgente-gdl does not exist.';
  end if;

  insert into public.profiles(id, full_name, role, active)
  values (v_user_id, 'Insurgente GDL', 'location_manager', true)
  on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      active = excluded.active,
      updated_at = now();

  delete from public.profile_locations
  where profile_id = v_user_id;

  insert into public.profile_locations(profile_id, location_id)
  values (v_user_id, v_location_id)
  on conflict do nothing;
end $$;

commit;
