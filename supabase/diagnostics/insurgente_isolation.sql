-- Safe diagnostics for Insurgente GDL isolation. These queries do not mutate data.

select id, name, slug, active
from public.locations
where slug in ('americana', 'chapalita', 'providencia', 'insurgente-gdl')
order by case slug
  when 'americana' then 1
  when 'chapalita' then 2
  when 'providencia' then 3
  when 'insurgente-gdl' then 4
  else 99
end;

select p.id, p.full_name, p.role, p.active, l.name as location_name, l.slug as location_slug
from public.profiles p
join auth.users u on u.id = p.id
left join public.profile_locations pl on pl.profile_id = p.id
left join public.locations l on l.id = pl.location_id
where lower(u.email) = lower('insurgente@craftcervezas.com');

select l.slug, count(bl.beer_id) as beers_in_catalog
from public.locations l
left join public.beer_locations bl on bl.location_id = l.id
where l.slug in ('americana', 'chapalita', 'providencia', 'insurgente-gdl')
group by l.slug
order by l.slug;

select tl.id, l.slug, tl.status, tl.published_at, count(i.id) as items
from public.tap_lists tl
join public.locations l on l.id = tl.location_id
left join public.tap_list_items i on i.tap_list_id = tl.id
where l.slug = 'insurgente-gdl'
group by tl.id, l.slug, tl.status, tl.published_at
order by tl.status, tl.published_at desc nulls last;

select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('beer_locations', 'beers', 'serving_options', 'tap_lists', 'tap_list_items')
order by tablename, policyname;
