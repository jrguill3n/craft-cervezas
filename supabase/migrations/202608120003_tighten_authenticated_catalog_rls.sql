begin;

-- The public site still needs to read beers and prices that appear on a
-- published tap list. Authenticated admins, however, must only see their own
-- catalogue unless they are super admins. Without the auth.uid() guard below,
-- a location_manager could read any Craft beer that is publicly published.

drop policy if exists beers_public_read on public.beers;

create policy beers_public_read
on public.beers for select
using (
  public.is_super_admin()
  or public.can_manage_beer(beers.id)
  or (
    auth.uid() is null
    and exists (
      select 1
      from public.tap_list_items i
      join public.tap_lists l on l.id = i.tap_list_id
      where i.beer_id = beers.id
        and l.status = 'published'
    )
  )
);

drop policy if exists serving_options_public_read on public.serving_options;

create policy serving_options_public_read
on public.serving_options for select
using (
  public.is_super_admin()
  or public.can_manage_beer(serving_options.beer_id)
  or (
    auth.uid() is null
    and exists (
      select 1
      from public.tap_list_items i
      join public.tap_lists l on l.id = i.tap_list_id
      where i.beer_id = serving_options.beer_id
        and l.status = 'published'
    )
  )
);

commit;
