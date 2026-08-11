-- Americana tap list update for 2026-08-11.
-- Run this in the Supabase SQL editor. It updates/creates the beers below and
-- replaces the published Americana tap list with these 15 taps in number order.

begin;

with input_beers(tap_number, name, brewery, style, abv, price) as (
  values
    (1,  'Caballo Blanco',              'Hercules',          'Pale Ale',               5.2, 110.00),
    (2,  'Nectaron',                    'Fausto',            'Session IPA',            4.8, 125.00),
    (3,  'Hop Hop Hurra',               'Santa Sabina',      'IPA',                    6.0, 100.00),
    (4,  'Pseudo Sue',                  'Toppling Goliath',  'Pale Ale',               5.8, 200.00),
    (5,  'La Ola',                      'Cyprez',            'IPA',                    6.2, 130.00),
    (6,  'DDH Pseudo Sue',              'Toppling Goliath',  'Pale Ale',               5.8, 200.00),
    (7,  'Lupulosa',                    'Insurgente',        'IPA',                    7.0, 115.00),
    (8,  'Super Lupe',                  'Hercules',          'IPA',                    7.0, 125.00),
    (9,  'Pineapple Express',           'Madueño',           'Hazy IPA',               7.2, 125.00),
    (10, 'Dipandemia',                  'Cyprez',            'Double WC IPA',          8.0, 130.00),
    (11, 'Huracán',                     'Hercules',          'Imperial Double IPA',    8.0, 200.00),
    (12, 'Señor Oscuro de la Montaña',  'Hercules',          'Imperial Stout',        14.0, 200.00),
    (13, 'La Guerra de los Wafles',     'Santa Sabina',      'Russian Imperial Stout',15.0, 180.00),
    (14, 'Chocobanana',                 'Santa Sabina',      'Pastry Stout',           7.2, 105.00),
    (15, 'Talega',                      'Buquibichi',        'Nitro Stout',            6.0, 100.00)
),
updated_beers as (
  update public.beers b
  set
    style = i.style,
    abv = i.abv,
    default_price = i.price,
    updated_at = now()
  from input_beers i
  where lower(trim(b.name)) = lower(trim(i.name))
    and lower(trim(b.brewery)) = lower(trim(i.brewery))
  returning b.id
),
inserted_beers as (
  insert into public.beers (name, brewery, style, abv, default_price)
  select i.name, i.brewery, i.style, i.abv, i.price
  from input_beers i
  where not exists (
    select 1
    from public.beers b
    where lower(trim(b.name)) = lower(trim(i.name))
      and lower(trim(b.brewery)) = lower(trim(i.brewery))
  )
  returning id
),
americana_location as (
  select id
  from public.locations
  where slug = 'americana'
),
delete_existing_lists as (
  delete from public.tap_lists t
  using americana_location l
  where t.location_id = l.id
    and t.status in ('draft', 'published')
  returning t.id
),
new_tap_list as (
  insert into public.tap_lists (location_id, status, published_at)
  select id, 'published', now()
  from americana_location
  returning id
),
matched_beers as (
  select distinct on (i.tap_number)
    i.tap_number,
    i.price,
    b.id as beer_id
  from input_beers i
  join public.beers b
    on lower(trim(b.name)) = lower(trim(i.name))
   and lower(trim(b.brewery)) = lower(trim(i.brewery))
  order by i.tap_number, b.updated_at desc, b.created_at desc
),
new_items as (
  insert into public.tap_list_items (
    tap_list_id,
    beer_id,
    tap_number,
    availability_status,
    badge,
    display_order
  )
  select
    t.id,
    b.beer_id,
    b.tap_number,
    'available',
    null,
    b.tap_number - 1
  from matched_beers b
  cross join new_tap_list t
  order by b.tap_number
  returning id, tap_number
)
insert into public.serving_options (
  tap_list_item_id,
  label,
  size,
  price,
  display_order
)
select
  ni.id,
  'Vaso',
  '16 oz',
  i.price,
  0
from new_items ni
join input_beers i on i.tap_number = ni.tap_number;

do $$
declare
  v_item_count integer;
  v_location_count integer;
begin
  select count(*) into v_location_count from public.locations where slug = 'americana';
  if v_location_count <> 1 then
    raise exception 'Expected exactly one Americana location, found %', v_location_count;
  end if;

  select count(*) into v_item_count
  from public.tap_list_items tli
  join public.tap_lists tl on tl.id = tli.tap_list_id
  join public.locations l on l.id = tl.location_id
  where l.slug = 'americana'
    and tl.status = 'published';

  if v_item_count <> 15 then
    raise exception 'Expected 15 published Americana taps, found %', v_item_count;
  end if;
end $$;

commit;
