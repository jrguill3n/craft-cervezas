-- Safe, read-only diagnostics for keg history.

select
  l.slug,
  kc.tap_number,
  b.name as beer,
  kc.connected_at,
  connected.full_name as connected_by,
  kc.disconnected_at,
  disconnected.full_name as disconnected_by
from public.keg_connections kc
join public.locations l on l.id = kc.location_id
join public.beers b on b.id = kc.beer_id
left join public.profiles connected on connected.id = kc.connected_by
left join public.profiles disconnected on disconnected.id = kc.disconnected_by
order by kc.connected_at desc;

-- Must return no rows: at most one open connection per location/tap.
select location_id, tap_number, count(*)
from public.keg_connections
where disconnected_at is null
group by location_id, tap_number
having count(*) > 1;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'keg_connections';
