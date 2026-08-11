begin;

-- Consolidate legacy prices into one catalogue-owned price per beer.
alter table public.serving_options
  add column if not exists beer_id uuid references public.beers(id) on delete cascade;
alter table public.serving_options
  alter column tap_list_item_id drop not null;

-- Older production versions stored the catalogue price directly on beers.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'beers' and column_name = 'default_price'
  ) then
    execute $sql$
      insert into public.serving_options(beer_id, label, size, price, display_order)
      select b.id, 'Pinta', 'Pinta', b.default_price, 1
      from public.beers b
      where b.default_price is not null and b.default_price > 0
        and not exists (select 1 from public.serving_options so where so.beer_id = b.id)
    $sql$;
  end if;
end $$;

-- Fill any remaining catalogue gaps from the primary legacy tap price.
insert into public.serving_options(beer_id, label, size, price, display_order)
select distinct on (i.beer_id)
  i.beer_id, 'Pinta', 'Pinta', so.price, 1
from public.tap_list_items i
join public.tap_lists tl on tl.id = i.tap_list_id
join public.serving_options so on so.tap_list_item_id = i.id
where so.price > 0
  and not exists (select 1 from public.serving_options catalog where catalog.beer_id = i.beer_id)
order by i.beer_id, (tl.status = 'published') desc, tl.published_at desc nulls last, so.display_order, so.created_at desc;

drop policy if exists serving_options_public_read on public.serving_options;
drop policy if exists serving_options_manager_write on public.serving_options;

delete from public.serving_options where tap_list_item_id is not null;

drop index if exists public.serving_options_item_order_idx;
drop index if exists public.serving_options_item_order_unique;
drop index if exists public.serving_options_one_per_item;
alter table public.serving_options drop constraint if exists serving_options_exactly_one_owner;
alter table public.serving_options drop column if exists tap_list_item_id;

delete from public.serving_options so
using public.serving_options keep
where so.beer_id = keep.beer_id
  and (so.display_order, so.created_at, so.id) > (keep.display_order, keep.created_at, keep.id);

create unique index if not exists serving_options_one_per_beer
  on public.serving_options(beer_id);
alter table public.serving_options alter column beer_id set not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'beers' and column_name = 'default_price'
  ) then
    alter table public.beers drop column default_price;
  end if;
end $$;

create policy serving_options_public_read on public.serving_options for select using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tap_list_items i
    join public.tap_lists l on l.id = i.tap_list_id
    where i.beer_id = serving_options.beer_id and l.status = 'published'
  )
  or exists (select 1 from public.profiles where id = auth.uid() and active)
);

create policy serving_options_manager_write on public.serving_options for all using (
  public.is_super_admin() or exists(select 1 from public.profiles where id = auth.uid() and active)
) with check (
  public.is_super_admin() or exists(select 1 from public.profiles where id = auth.uid() and active)
);

commit;
