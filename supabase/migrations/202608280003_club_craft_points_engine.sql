begin;

alter table public.points_transactions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists points_transactions_unique_earn_reference_idx
  on public.points_transactions(reference_type, reference_id)
  where transaction_type = 'earn'
    and reference_type is not null
    and reference_id is not null;

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club_members(id) on delete restrict,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_spent integer not null,
  redeemed_by uuid references public.profiles(id) on delete set null,
  points_transaction_id uuid not null unique references public.points_transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint redemptions_points_spent_positive check (points_spent > 0)
);

create index if not exists redemptions_member_created_idx
  on public.redemptions(member_id, created_at desc);

create index if not exists redemptions_reward_created_idx
  on public.redemptions(reward_id, created_at desc);

alter table public.redemptions enable row level security;

drop policy if exists redemptions_admin_read on public.redemptions;
create policy redemptions_admin_read
on public.redemptions for select
to authenticated
using (public.is_club_craft_admin());

grant select on public.redemptions to authenticated;

create or replace function public.calculate_club_points(p_eligible_purchase_amount numeric)
returns integer
language sql
immutable
set search_path = pg_catalog, public
as $$
  select greatest(floor(coalesce(p_eligible_purchase_amount, 0) * 0.05)::integer, 0);
$$;

create or replace function public.protect_club_member_points_balance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.points_balance is distinct from new.points_balance
    and coalesce(current_setting('app.club_craft_points_update', true), '') <> 'on'
  then
    raise exception 'El balance de puntos solo puede modificarse con una transacción de Club Craft.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_club_member_points_balance on public.club_members;
create trigger protect_club_member_points_balance
before update of points_balance on public.club_members
for each row execute function public.protect_club_member_points_balance();

create or replace function public.protect_points_transactions_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Las transacciones de puntos no se pueden editar ni eliminar.'
      using errcode = '42501';
  end if;

  if coalesce(current_setting('app.club_craft_points_transaction', true), '') <> 'on' then
    raise exception 'Las transacciones de puntos solo pueden crearse con el motor de Club Craft.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_points_transactions_audit on public.points_transactions;
create trigger protect_points_transactions_audit
before insert or update or delete on public.points_transactions
for each row execute function public.protect_points_transactions_audit();

create or replace function public.protect_redemptions_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Los canjes no se pueden editar ni eliminar.'
      using errcode = '42501';
  end if;

  if coalesce(current_setting('app.club_craft_points_transaction', true), '') <> 'on' then
    raise exception 'Los canjes solo pueden crearse con el motor de Club Craft.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_redemptions_audit on public.redemptions;
create trigger protect_redemptions_audit
before insert or update or delete on public.redemptions
for each row execute function public.protect_redemptions_audit();

create or replace function public.create_club_points_transaction(
  p_member_id uuid,
  p_transaction_type public.points_transaction_type,
  p_points integer,
  p_reference_type text default null,
  p_reference_id text default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  member_id uuid,
  points integer,
  balance_after integer
)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
begin
  if not public.is_club_craft_admin() then
    raise exception 'No tienes permiso para administrar Club Craft.'
      using errcode = '42501';
  end if;

  if p_points is null or p_points = 0 then
    raise exception 'Los puntos deben ser distintos de cero.';
  end if;

  if p_transaction_type = 'earn' and p_points <= 0 then
    raise exception 'Una acumulación debe sumar puntos.';
  elsif p_transaction_type = 'redeem' and p_points >= 0 then
    raise exception 'Un canje debe restar puntos.';
  elsif p_transaction_type = 'expiration' and p_points >= 0 then
    raise exception 'Una expiración debe restar puntos.';
  elsif p_transaction_type = 'adjustment' and btrim(coalesce(p_reason, '')) = '' then
    raise exception 'El motivo es obligatorio para ajustar puntos.';
  end if;

  select cm.points_balance
    into v_current_balance
  from public.club_members cm
  where cm.id = p_member_id
  for update;

  if not found then
    raise exception 'No se encontró el miembro de Club Craft.';
  end if;

  v_new_balance := v_current_balance + p_points;

  if v_new_balance < 0 then
    raise exception 'La operación dejaría el balance en negativo.';
  end if;

  perform set_config('app.club_craft_points_transaction', 'on', true);

  insert into public.points_transactions (
    member_id,
    transaction_type,
    points,
    balance_after,
    reference_type,
    reference_id,
    reason,
    metadata,
    created_by
  )
  values (
    p_member_id,
    p_transaction_type,
    p_points,
    v_new_balance,
    nullif(btrim(coalesce(p_reference_type, '')), ''),
    nullif(btrim(coalesce(p_reference_id, '')), ''),
    nullif(btrim(coalesce(p_reason, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    auth.uid()
  )
  returning id into v_transaction_id;

  perform set_config('app.club_craft_points_update', 'on', true);

  update public.club_members
  set points_balance = v_new_balance,
      last_activity_at = now()
  where id = p_member_id;

  return query select v_transaction_id, p_member_id, p_points, v_new_balance;
end;
$$;

create or replace function public.redeem_club_reward(
  p_member_id uuid,
  p_reward_id uuid
)
returns table (
  redemption_id uuid,
  transaction_id uuid,
  member_id uuid,
  reward_id uuid,
  points integer,
  balance_after integer
)
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_current_balance integer;
  v_new_balance integer;
  v_reward_name text;
  v_reward_points integer;
  v_transaction_id uuid;
  v_redemption_id uuid;
begin
  if not public.is_club_craft_admin() then
    raise exception 'No tienes permiso para administrar Club Craft.'
      using errcode = '42501';
  end if;

  select r.name, r.points_cost
    into v_reward_name, v_reward_points
  from public.rewards r
  where r.id = p_reward_id
    and r.active = true
  for update;

  if not found then
    raise exception 'La recompensa no existe o está inactiva.';
  end if;

  select cm.points_balance
    into v_current_balance
  from public.club_members cm
  where cm.id = p_member_id
  for update;

  if not found then
    raise exception 'No se encontró el miembro de Club Craft.';
  end if;

  v_new_balance := v_current_balance - v_reward_points;

  if v_new_balance < 0 then
    raise exception 'El miembro no tiene puntos suficientes para este canje.';
  end if;

  perform set_config('app.club_craft_points_transaction', 'on', true);

  insert into public.points_transactions (
    member_id,
    transaction_type,
    points,
    balance_after,
    reference_type,
    reference_id,
    reason,
    metadata,
    created_by
  )
  values (
    p_member_id,
    'redeem',
    -v_reward_points,
    v_new_balance,
    'reward',
    p_reward_id::text,
    'Canje: ' || v_reward_name,
    jsonb_build_object('reward_name', v_reward_name),
    auth.uid()
  )
  returning id into v_transaction_id;

  perform set_config('app.club_craft_points_update', 'on', true);

  update public.club_members
  set points_balance = v_new_balance,
      last_activity_at = now()
  where id = p_member_id;

  insert into public.redemptions (
    member_id,
    reward_id,
    points_spent,
    redeemed_by,
    points_transaction_id
  )
  values (
    p_member_id,
    p_reward_id,
    v_reward_points,
    auth.uid(),
    v_transaction_id
  )
  returning id into v_redemption_id;

  return query select
    v_redemption_id,
    v_transaction_id,
    p_member_id,
    p_reward_id,
    -v_reward_points,
    v_new_balance;
end;
$$;

revoke execute on function public.calculate_club_points(numeric) from public, anon;
revoke execute on function public.create_club_points_transaction(uuid, public.points_transaction_type, integer, text, text, text, jsonb) from public, anon;
revoke execute on function public.redeem_club_reward(uuid, uuid) from public, anon;

grant execute on function public.calculate_club_points(numeric) to authenticated;
grant execute on function public.create_club_points_transaction(uuid, public.points_transaction_type, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.redeem_club_reward(uuid, uuid) to authenticated;

commit;
