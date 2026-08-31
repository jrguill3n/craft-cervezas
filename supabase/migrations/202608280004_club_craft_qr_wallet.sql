begin;

create or replace function public.normalize_club_member_code(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select upper(btrim(coalesce(p_value, '')));
$$;

create or replace function public.parse_club_member_qr_payload(p_payload text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select case
    when upper(btrim(coalesce(p_payload, ''))) ~ '^CLUBCRAFT:CC-[A-F0-9]{8}$'
      then substr(upper(btrim(p_payload)), 11)
    when upper(btrim(coalesce(p_payload, ''))) ~ '^CC-[A-F0-9]{8}$'
      then upper(btrim(p_payload))
    else null
  end;
$$;

create or replace function public.get_public_club_member_by_code(p_member_code text)
returns table (
  member_code text,
  first_name text,
  points_balance integer,
  status public.club_member_status
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    cm.member_code,
    cm.first_name,
    cm.points_balance,
    cm.status
  from public.club_members cm
  where cm.member_code = public.normalize_club_member_code(p_member_code)
  limit 1;
$$;

create or replace function public.get_admin_club_member_by_qr(p_payload text)
returns table (
  id uuid,
  member_code text,
  first_name text,
  last_name text,
  points_balance integer,
  status public.club_member_status
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_member_code text;
begin
  if not public.is_club_craft_admin() then
    raise exception 'No tienes permiso para administrar Club Craft.'
      using errcode = '42501';
  end if;

  v_member_code := public.parse_club_member_qr_payload(p_payload);

  if v_member_code is null then
    raise exception 'El QR o código no es válido.';
  end if;

  return query
    select
      cm.id,
      cm.member_code,
      cm.first_name,
      cm.last_name,
      cm.points_balance,
      cm.status
    from public.club_members cm
    where cm.member_code = v_member_code
    limit 1;
end;
$$;

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
  v_status public.club_member_status;
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

  select cm.points_balance, cm.status
    into v_current_balance, v_status
  from public.club_members cm
  where cm.id = p_member_id
  for update;

  if not found then
    raise exception 'No se encontró el miembro de Club Craft.';
  end if;

  if v_status <> 'active' then
    raise exception 'El miembro está inactivo.';
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
  v_status public.club_member_status;
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

  select cm.points_balance, cm.status
    into v_current_balance, v_status
  from public.club_members cm
  where cm.id = p_member_id
  for update;

  if not found then
    raise exception 'No se encontró el miembro de Club Craft.';
  end if;

  if v_status <> 'active' then
    raise exception 'El miembro está inactivo.';
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

revoke execute on function public.normalize_club_member_code(text) from public;
revoke execute on function public.parse_club_member_qr_payload(text) from public;
revoke execute on function public.get_public_club_member_by_code(text) from public;
revoke execute on function public.get_admin_club_member_by_qr(text) from public, anon;

grant execute on function public.normalize_club_member_code(text) to anon, authenticated;
grant execute on function public.parse_club_member_qr_payload(text) to authenticated;
grant execute on function public.get_public_club_member_by_code(text) to anon, authenticated;
grant execute on function public.get_admin_club_member_by_qr(text) to authenticated;

commit;
