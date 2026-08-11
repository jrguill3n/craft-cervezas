-- Safe, read-only diagnostics to run in Supabase Dashboard > SQL Editor.

-- 1) Expected locations and exact slugs.
select id, name, slug, active
from public.locations
where slug in ('providencia', 'americana', 'chapalita')
order by slug;

-- 2) Chapalita drafts and publication history.
select tl.id, tl.status, tl.created_at, tl.updated_at, tl.published_at, tl.published_by
from public.tap_lists tl
join public.locations l on l.id = tl.location_id
where l.slug = 'chapalita'
order by tl.created_at desc;

-- 3) Published Chapalita list, items, beers and item-level serving options.
select
  tl.id as tap_list_id,
  tl.status,
  tl.published_at,
  i.id as item_id,
  i.tap_number,
  i.display_order as item_order,
  b.id as beer_id,
  b.name as beer,
  b.brewery,
  b.style,
  b.abv,
  so.id as serving_option_id,
  so.label,
  so.size,
  so.price as price_mxn,
  so.display_order as price_order
from public.locations l
join public.tap_lists tl on tl.location_id = l.id and tl.status = 'published'
left join public.tap_list_items i on i.tap_list_id = tl.id
left join public.beers b on b.id = i.beer_id
left join public.serving_options so on so.tap_list_item_id = i.id
where l.slug = 'chapalita'
order by i.display_order, so.display_order;

-- 4) RLS enabled state.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('locations','profiles','profile_locations','beers','tap_lists','tap_list_items','serving_options')
order by tablename;

-- 5) Active policies and roles/commands.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('locations','profiles','profile_locations','beers','tap_lists','tap_list_items','serving_options')
order by tablename, policyname;

-- 6) Partial unique indexes enforcing one draft and one publication per location.
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in ('tap_lists_one_draft_per_location', 'tap_lists_one_published_per_location')
order by indexname;

-- 7) Function execution privileges. Both RPCs should be executable by authenticated, not anon.
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name in ('create_draft_tap_list', 'publish_tap_list')
order by routine_name, grantee;
