-- Make price part of the beer catalogue. The value is copied to the primary
-- "Vaso" serving option whenever the beer is added to a tap list.
alter table public.beers
  add column if not exists default_price numeric(10,2);

alter table public.beers
  drop constraint if exists beers_default_price_check;

alter table public.beers
  add constraint beers_default_price_check
  check (default_price is null or default_price > 0);

-- Preserve existing prices by using the first serving option already defined
-- for each beer. Legacy catalogue entries without a tap price remain pending
-- and the admin requires a price the next time they are edited.
update public.beers b
set default_price = (
  select so.price
  from public.tap_list_items tli
  join public.serving_options so on so.tap_list_item_id = tli.id
  where tli.beer_id = b.id
  order by so.display_order asc, so.created_at desc
  limit 1
)
where b.default_price is null
  and exists (
    select 1
    from public.tap_list_items tli
    join public.serving_options so on so.tap_list_item_id = tli.id
    where tli.beer_id = b.id
  );

comment on column public.beers.default_price is
  'Default MXN price copied to the primary serving option when added to a tap list.';
