begin;

create extension if not exists pgcrypto;

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  instagram_url text not null,
  sort_order integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_title_not_blank check (btrim(title) <> ''),
  constraint promotions_image_url_not_blank check (btrim(image_url) <> ''),
  constraint promotions_instagram_url_not_blank check (btrim(instagram_url) <> ''),
  constraint promotions_instagram_url_format check (instagram_url ~* '^https://(www\.)?instagram\.com/'),
  constraint promotions_sort_order_range check (sort_order between 1 and 6)
);

create unique index if not exists promotions_active_sort_order_unique
  on public.promotions(sort_order)
  where active;

create index if not exists promotions_active_order_idx
  on public.promotions(active, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

create or replace function public.enforce_promotions_active_limit()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.active and (
    select count(*)
    from public.promotions p
    where p.active
      and p.id <> new.id
  ) >= 6 then
    raise exception 'maximum active promotions reached' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_promotions_active_limit on public.promotions;
create trigger enforce_promotions_active_limit
before insert or update of active on public.promotions
for each row execute function public.enforce_promotions_active_limit();

alter table public.promotions enable row level security;

grant execute on function public.is_super_admin() to anon, authenticated;

drop policy if exists promotions_public_read on public.promotions;
drop policy if exists promotions_super_admin_read on public.promotions;
drop policy if exists promotions_super_admin_insert on public.promotions;
drop policy if exists promotions_super_admin_update on public.promotions;
drop policy if exists promotions_super_admin_delete on public.promotions;

create policy promotions_public_read
on public.promotions for select
using (active);

create policy promotions_super_admin_read
on public.promotions for select
using (public.is_super_admin());

create policy promotions_super_admin_insert
on public.promotions for insert
with check (public.is_super_admin());

create policy promotions_super_admin_update
on public.promotions for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy promotions_super_admin_delete
on public.promotions for delete
using (public.is_super_admin());

grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'promotions',
  'promotions',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists promotions_storage_public_read on storage.objects;
drop policy if exists promotions_storage_super_admin_insert on storage.objects;
drop policy if exists promotions_storage_super_admin_update on storage.objects;
drop policy if exists promotions_storage_super_admin_delete on storage.objects;

create policy promotions_storage_public_read
on storage.objects for select
using (bucket_id = 'promotions');

create policy promotions_storage_super_admin_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'promotions' and public.is_super_admin());

create policy promotions_storage_super_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'promotions' and public.is_super_admin())
with check (bucket_id = 'promotions' and public.is_super_admin());

create policy promotions_storage_super_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'promotions' and public.is_super_admin());

with seed(title, image_url, instagram_url, sort_order, active) as (
  values
    (
      'Craft To Go · 4 Pack',
      '/brand/promotions/craft-to-go-4pack.png',
      'https://www.instagram.com/p/DbJszluFasi/',
      1,
      true
    ),
    (
      'Sábado 6x5 para llevar',
      '/brand/promotions/sabado-6x5.png',
      'https://www.instagram.com/p/DTjOz4FFTGl/',
      2,
      true
    ),
    (
      'Miércoles 3x2 en chela de barril',
      '/brand/promotions/miercoles-3x2.png',
      'https://www.instagram.com/p/DObuWqREp-1/',
      3,
      true
    )
)
update public.promotions p
set image_url = seed.image_url,
    instagram_url = seed.instagram_url,
    sort_order = seed.sort_order,
    active = seed.active,
    updated_at = now()
from seed
where p.title = seed.title;

with seed(title, image_url, instagram_url, sort_order, active) as (
  values
    (
      'Craft To Go · 4 Pack',
      '/brand/promotions/craft-to-go-4pack.png',
      'https://www.instagram.com/p/DbJszluFasi/',
      1,
      true
    ),
    (
      'Sábado 6x5 para llevar',
      '/brand/promotions/sabado-6x5.png',
      'https://www.instagram.com/p/DTjOz4FFTGl/',
      2,
      true
    ),
    (
      'Miércoles 3x2 en chela de barril',
      '/brand/promotions/miercoles-3x2.png',
      'https://www.instagram.com/p/DObuWqREp-1/',
      3,
      true
    )
)
insert into public.promotions(title, image_url, instagram_url, sort_order, active)
select seed.title, seed.image_url, seed.instagram_url, seed.sort_order, seed.active
from seed
where not exists (
  select 1
  from public.promotions p
  where p.title = seed.title
);

commit;
