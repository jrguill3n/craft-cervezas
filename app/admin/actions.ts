'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canManageClubCraft, getManageableLocationIds } from '@/lib/admin-scope'
import { calculateClubCraftEarnPoints } from '@/lib/club-craft-points'
import { createClubCraftQrPayload, parseClubCraftQrPayload } from '@/lib/club-craft-qr'
import { isCanonicalInstagramPostUrl, normalizeInstagramUrl } from '@/lib/instagram'
import { getPosterPurchasePreview } from '@/lib/poster'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .single()
  if (!profile?.active) throw new Error('Cuenta inactiva')
  return { supabase, user, profile }
}

async function requireSuperAdmin() {
  const context = await requireAuth()
  if (context.profile.role !== 'super_admin') {
    throw new Error('Solo super admins pueden administrar promociones.')
  }
  return context
}

async function requireClubCraftAdmin() {
  const context = await requireAuth()
  const allowed = await canManageClubCraft(context.supabase, context.profile)
  if (!allowed) {
    throw new Error('No tienes permiso para administrar Club Craft.')
  }
  return context
}

async function getBeerCreationLocationIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: { id: string; role: 'super_admin' | 'location_manager' },
) {
  return getManageableLocationIds(supabase, profile)
}

function normalizePhone(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const startsWithPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  return `${startsWithPlus ? '+' : ''}${digits}`
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || null
}

function parseClubMemberForm(formData: FormData) {
  const first_name = String(formData.get('first_name') ?? '').trim()
  const last_name = normalizeOptionalText(formData.get('last_name'))
  const phone = normalizePhone(formData.get('phone'))
  const email = normalizeOptionalText(formData.get('email'))?.toLowerCase() ?? null
  const birth_date = normalizeOptionalText(formData.get('birth_date'))

  if (!first_name) throw new Error('El nombre es obligatorio.')
  if (!phone || phone.replace(/\D/g, '').length < 7) {
    throw new Error('Agrega un teléfono válido.')
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Agrega un correo válido.')
  }
  if (birth_date && Number.isNaN(Date.parse(`${birth_date}T00:00:00`))) {
    throw new Error('Agrega una fecha de nacimiento válida.')
  }

  return { first_name, last_name, phone, email, birth_date }
}

function parseRewardForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const description = normalizeOptionalText(formData.get('description'))
  const image_url = normalizeOptionalText(formData.get('image_url'))
  const points_cost = Number(formData.get('points_cost'))
  const stockValue = normalizeOptionalText(formData.get('stock_optional'))
  const stock_optional = stockValue === null ? null : Number(stockValue)
  const active = String(formData.get('active') ?? 'false') === 'true'

  if (!name) throw new Error('El nombre de la recompensa es obligatorio.')
  if (!Number.isInteger(points_cost) || points_cost <= 0) {
    throw new Error('El costo en puntos debe ser mayor a cero.')
  }
  if (stockValue !== null && (!Number.isInteger(Number(stockValue)) || Number(stockValue) < 0)) {
    throw new Error('El stock debe ser un número entero positivo o quedar vacío.')
  }

  return { name, description, image_url, points_cost, stock_optional, active }
}

function parsePositiveMoney(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Agrega un monto elegible válido.')
  }
  return amount
}

function parsePositiveInteger(value: FormDataEntryValue | null, message: string) {
  const points = Number(value)
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error(message)
  }
  return points
}

function parseRpcRow<T>(data: T[] | T | null) {
  return Array.isArray(data) ? data[0] : data
}

function handlePointsRpcError(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    throw new Error('Esa referencia ya fue registrada en Club Craft.')
  }
  throw new Error(error.message)
}

// ── Tap List ─────────────────────────────────────────────────────────────────

export type TapListSaveItem = {
  beer_id: string
  tap_number: number | null
  badge: 'new' | 'limited' | 'guest' | 'house' | null
}

export async function saveAndPublishTapList(locationId: string, items: TapListSaveItem[]) {
  const { supabase, profile } = await requireAuth()
  if (!locationId) throw new Error('Falta la sucursal.')

  const manageableLocationIds = await getManageableLocationIds(supabase, profile)
  if (!manageableLocationIds.includes(locationId)) {
    throw new Error('No tienes permiso para administrar esta sucursal.')
  }

  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, slug')
    .eq('id', locationId)
    .eq('active', true)
    .maybeSingle()
  if (locationError) throw new Error(locationError.message)
  if (!location) throw new Error('No tienes permiso para administrar esta sucursal.')

  const tapNumbers = items
    .map((item) => item.tap_number)
    .filter((tapNumber): tapNumber is number => tapNumber !== null)
  if (tapNumbers.some((tapNumber) => !Number.isInteger(tapNumber) || tapNumber < 1 || tapNumber > 99)) {
    throw new Error('Los números de tap deben ser enteros entre 1 y 99.')
  }
  if (new Set(tapNumbers).size !== tapNumbers.length) {
    throw new Error('No puede haber dos cervezas con el mismo número de tap.')
  }
  if (items.some((item, index) => item.tap_number !== index + 1)) {
    throw new Error('El orden y el número de tap deben coincidir consecutivamente desde 1.')
  }
  for (const item of items) {
    if (!item.beer_id) throw new Error('Hay una cerveza inválida en el tap list.')
  }

  const beerIds = [...new Set(items.map((item) => item.beer_id))]
  if (beerIds.length > 0) {
    const { data: allowedBeers, error: allowedBeerError } = await supabase
      .from('beer_locations')
      .select('beer_id')
      .eq('location_id', locationId)
      .in('beer_id', beerIds)
    if (allowedBeerError) throw new Error(allowedBeerError.message)

    const allowedBeerIds = new Set((allowedBeers ?? []).map((row) => row.beer_id))
    if (beerIds.some((beerId) => !allowedBeerIds.has(beerId))) {
      throw new Error('Una o más cervezas no pertenecen al catálogo de esta sucursal.')
    }

    const { data: catalogPrices, error: catalogError } = await supabase
      .from('serving_options')
      .select('beer_id, price')
      .in('beer_id', beerIds)
    if (catalogError) throw new Error(catalogError.message)
    const validPrices = new Set(
      (catalogPrices ?? []).filter((option) => Number(option.price) > 0).map((option) => option.beer_id),
    )
    if (beerIds.some((beerId) => !validPrices.has(beerId))) {
      throw new Error('Todas las cervezas deben tener un precio válido en el catálogo de Cervezas.')
    }
  }

  // Remove any abandoned records from the former draft-based workflow.
  const { error: cleanupError } = await supabase
    .from('tap_lists')
    .delete()
    .eq('location_id', locationId)
    .eq('status', 'draft')
  if (cleanupError) throw new Error(cleanupError.message)

  const { data: list, error: listError } = await supabase
    .from('tap_lists')
    .insert({ location_id: locationId, status: 'draft' })
    .select('id')
    .single()
  if (listError || !list) throw new Error(listError?.message ?? 'No se pudo guardar el tap list.')

  try {
    for (const [index, item] of items.entries()) {
      const { error: itemError } = await supabase
        .from('tap_list_items')
        .insert({
          tap_list_id: list.id,
          beer_id: item.beer_id,
          tap_number: item.tap_number,
          badge: item.badge,
          display_order: index,
        })
      if (itemError) throw itemError
    }

    const { error: publishError } = await supabase.rpc('publish_tap_list', {
      p_tap_list_id: list.id,
    })
    if (publishError) throw publishError
  } catch (error) {
    await supabase.from('tap_lists').delete().eq('id', list.id)
    throw new Error(error instanceof Error ? error.message : 'No se pudo guardar el tap list.')
  }

  revalidatePath(`/${location.slug}`, 'page')
  revalidatePath('/taplist', 'page')
  revalidatePath('/admin')
}

// ── Beer CRUD ─────────────────────────────────────────────────────────────────

export async function createBeer(formData: FormData) {
  const { supabase, profile } = await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  const brewery = String(formData.get('brewery') ?? '').trim()
  const style = String(formData.get('style') ?? '').trim()
  const abv = Number(formData.get('abv'))
  const price = Number(formData.get('price'))
  if (!name || !brewery || !style) throw new Error('Nombre, cervecería y estilo son obligatorios.')
  if (!Number.isFinite(abv) || abv < 0 || abv > 100) throw new Error('El ABV debe estar entre 0 y 100.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser mayor a cero.')
  const beerId = crypto.randomUUID()
  const { error } = await supabase
    .from('beers')
    .insert({
      id: beerId,
      name,
      brewery,
      style,
      abv,
    })
  if (error) throw new Error(error.message)
  const locationIds = await getBeerCreationLocationIds(supabase, profile)
  if (locationIds.length === 0) {
    await supabase.from('beers').delete().eq('id', beerId)
    throw new Error('No hay sucursales asignadas para esta cerveza.')
  }

  const { error: locationError } = await supabase
    .from('beer_locations')
    .upsert(
      locationIds.map((locationId) => ({ beer_id: beerId, location_id: locationId })),
      { onConflict: 'beer_id,location_id', ignoreDuplicates: true },
    )
  if (locationError) {
    await supabase.from('beers').delete().eq('id', beerId)
    throw new Error(locationError.message)
  }

  const { error: priceError } = await supabase.from('serving_options').insert({
    beer_id: beerId,
    label: 'Pinta',
    size: 'Pinta',
    price,
    display_order: 1,
  })
  if (priceError) {
    await supabase.from('beers').delete().eq('id', beerId)
    throw new Error(priceError.message)
  }
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
  revalidatePath('/taplist', 'page')
  return { id: beerId, name, brewery, style, abv }
}

export async function updateBeer(id: string, formData: FormData) {
  const { supabase, profile } = await requireAuth()
  if (!id) throw new Error('Falta la cerveza que se quiere actualizar.')
  const name = String(formData.get('name') ?? '').trim()
  const brewery = String(formData.get('brewery') ?? '').trim()
  const style = String(formData.get('style') ?? '').trim()
  const abv = Number(formData.get('abv'))
  const price = Number(formData.get('price'))
  if (!name || !brewery || !style) throw new Error('Nombre, cervecería y estilo son obligatorios.')
  if (!Number.isFinite(abv) || abv < 0 || abv > 100) throw new Error('El ABV debe estar entre 0 y 100.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser mayor a cero.')
  const manageableLocationIds = await getManageableLocationIds(supabase, profile)
  if (manageableLocationIds.length === 0) throw new Error('No tienes sucursales asignadas.')

  const { data: existingBeer, error: existingBeerError } = await supabase
    .from('beers')
    .select('id, beer_locations!inner(location_id)')
    .eq('id', id)
    .in('beer_locations.location_id', manageableLocationIds)
    .maybeSingle()
  if (existingBeerError) throw new Error(existingBeerError.message)
  if (!existingBeer) throw new Error('No tienes permiso para editar esta cerveza.')

  const { error } = await supabase
    .from('beers')
    .update({
      name,
      brewery,
      style,
      abv,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  const { data: primary } = await supabase
    .from('serving_options')
    .select('id')
    .eq('beer_id', id)
    .limit(1)
    .maybeSingle()
  const priceMutation = primary
    ? supabase.from('serving_options').update({ label: 'Pinta', size: 'Pinta', price, display_order: 1 }).eq('id', primary.id)
    : supabase.from('serving_options').insert({ beer_id: id, label: 'Pinta', size: 'Pinta', price, display_order: 1 })
  const { error: priceError } = await priceMutation
  if (priceError) throw new Error(priceError.message)
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
  revalidatePath('/taplist', 'page')
}

export async function deleteBeer(id: string) {
  const { supabase, profile } = await requireAuth()
  const manageableLocationIds = await getManageableLocationIds(supabase, profile)
  if (manageableLocationIds.length === 0) throw new Error('No tienes sucursales asignadas.')

  const { data: existingBeer, error: existingBeerError } = await supabase
    .from('beers')
    .select('id, beer_locations!inner(location_id)')
    .eq('id', id)
    .in('beer_locations.location_id', manageableLocationIds)
    .maybeSingle()
  if (existingBeerError) throw new Error(existingBeerError.message)
  if (!existingBeer) throw new Error('No tienes permiso para eliminar esta cerveza.')

  const { error } = await supabase.from('beers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
  revalidatePath('/taplist', 'page')
}

// ── Club Craft ───────────────────────────────────────────────────────────────

export async function createClubMember(formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  const input = parseClubMemberForm(formData)

  const { data: duplicate, error: duplicateError } = await supabase
    .from('club_members')
    .select('id')
    .eq('phone', input.phone)
    .maybeSingle()
  if (duplicateError) throw new Error(duplicateError.message)
  if (duplicate) throw new Error('Ya existe un miembro con ese teléfono.')

  const { data, error } = await supabase
    .from('club_members')
    .insert(input)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un miembro con ese teléfono.')
    throw new Error(error.message)
  }

  revalidatePath('/admin/club/members')
  return { id: data.id as string }
}

export async function updateClubMember(id: string, formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  if (!id) throw new Error('Falta el miembro.')
  const input = parseClubMemberForm(formData)
  const status = String(formData.get('status') ?? 'active')
  if (status !== 'active' && status !== 'inactive') {
    throw new Error('El estatus no es válido.')
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from('club_members')
    .select('id')
    .eq('phone', input.phone)
    .neq('id', id)
    .maybeSingle()
  if (duplicateError) throw new Error(duplicateError.message)
  if (duplicate) throw new Error('Ya existe otro miembro con ese teléfono.')

  const { error } = await supabase
    .from('club_members')
    .update({ ...input, status })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe otro miembro con ese teléfono.')
    throw new Error(error.message)
  }

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${id}`)
}

export async function setClubMemberStatus(id: string, status: 'active' | 'inactive') {
  const { supabase } = await requireClubCraftAdmin()
  if (!id) throw new Error('Falta el miembro.')
  if (status !== 'active' && status !== 'inactive') throw new Error('El estatus no es válido.')

  const { error } = await supabase
    .from('club_members')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${id}`)
}

export async function registerClubPurchase(memberId: string, formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  if (!memberId) throw new Error('Falta el miembro.')

  const eligiblePurchaseAmount = parsePositiveMoney(formData.get('eligible_purchase_amount'))
  const points = calculateClubCraftEarnPoints(eligiblePurchaseAmount)
  if (points <= 0) {
    throw new Error('El monto elegible no genera puntos suficientes.')
  }

  const referenceId = normalizeOptionalText(formData.get('reference_id'))
  const note = normalizeOptionalText(formData.get('note'))

  const { data, error } = await supabase.rpc('create_club_points_transaction', {
    p_member_id: memberId,
    p_transaction_type: 'earn',
    p_points: points,
    p_reference_type: 'manual_purchase',
    p_reference_id: referenceId,
    p_reason: note ?? 'Compra manual',
    p_metadata: {
      eligible_purchase_amount: eligiblePurchaseAmount,
      note,
    },
  })

  if (error) handlePointsRpcError(error)

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${memberId}`)
  revalidatePath('/admin/club/points-transactions')

  return parseRpcRow(data)
}

export async function previewClubPosterPurchase(transactionId: string) {
  const { supabase } = await requireClubCraftAdmin()

  const { data: rates, error: ratesError } = await supabase
    .from('poster_category_point_rates')
    .select('poster_category_id, poster_category_name, root_category_id, root_category_name, points_rate, active')
    .eq('active', true)

  if (ratesError) throw new Error(ratesError.message)

  const preview = await getPosterPurchasePreview(transactionId, rates ?? [])

  const { data: existing, error: existingError } = await supabase
    .from('points_transactions')
    .select('id')
    .eq('transaction_type', 'earn')
    .eq('reference_type', 'poster_transaction')
    .eq('reference_id', preview.transactionId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  return {
    ...preview,
    alreadyRegistered: Boolean(existing),
  }
}

export async function registerClubPosterPurchase(memberId: string, transactionId: string) {
  const { supabase } = await requireClubCraftAdmin()
  if (!memberId) throw new Error('Falta el miembro.')

  const preview = await previewClubPosterPurchase(transactionId)

  if (preview.alreadyRegistered) {
    throw new Error('Este ticket de Poster ya fue registrado en Club Craft.')
  }
  if (preview.points <= 0 || preview.eligibleAmount <= 0) {
    throw new Error('Este ticket no tiene productos elegibles para acumular puntos.')
  }

  const { data, error } = await supabase.rpc('create_club_points_transaction', {
    p_member_id: memberId,
    p_transaction_type: 'earn',
    p_points: preview.points,
    p_reference_type: 'poster_transaction',
    p_reference_id: preview.transactionId,
    p_reason: 'Compra Poster',
    p_metadata: {
      poster_transaction_id: preview.transactionId,
      poster_spot_id: preview.spotId,
      poster_spot_name: preview.spotName,
      poster_closed_at: preview.closedAt,
      poster_total_paid: preview.totalPaid,
      eligible_purchase_amount: preview.eligibleAmount,
      eligible_items: preview.eligibleItems,
      ineligible_items: preview.ineligibleItems,
    },
  })

  if (error) handlePointsRpcError(error)

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${memberId}`)
  revalidatePath('/admin/club/points-transactions')

  return parseRpcRow(data)
}

export async function adjustClubPoints(memberId: string, formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  if (!memberId) throw new Error('Falta el miembro.')

  const direction = String(formData.get('direction') ?? 'add')
  if (direction !== 'add' && direction !== 'remove') {
    throw new Error('El tipo de ajuste no es válido.')
  }

  const amount = parsePositiveInteger(formData.get('points'), 'Agrega una cantidad de puntos válida.')
  const reason = normalizeOptionalText(formData.get('reason'))
  if (!reason) throw new Error('El motivo es obligatorio para ajustar puntos.')

  const points = direction === 'remove' ? -amount : amount

  const { data, error } = await supabase.rpc('create_club_points_transaction', {
    p_member_id: memberId,
    p_transaction_type: 'adjustment',
    p_points: points,
    p_reference_type: 'manual_adjustment',
    p_reference_id: normalizeOptionalText(formData.get('reference_id')),
    p_reason: reason,
    p_metadata: {
      direction,
    },
  })

  if (error) handlePointsRpcError(error)

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${memberId}`)
  revalidatePath('/admin/club/points-transactions')

  return parseRpcRow(data)
}

export async function redeemClubReward(memberId: string, rewardId: string) {
  const { supabase } = await requireClubCraftAdmin()
  if (!memberId) throw new Error('Falta el miembro.')
  if (!rewardId) throw new Error('Falta la recompensa.')

  const { data, error } = await supabase.rpc('redeem_club_reward', {
    p_member_id: memberId,
    p_reward_id: rewardId,
  })

  if (error) handlePointsRpcError(error)

  revalidatePath('/admin/club/members')
  revalidatePath(`/admin/club/members/${memberId}`)
  revalidatePath('/admin/club/points-transactions')
  revalidatePath('/admin/club/rewards')

  return parseRpcRow(data)
}

export async function lookupClubMemberByQr(payload: string) {
  const { supabase } = await requireClubCraftAdmin()
  const memberCode = parseClubCraftQrPayload(payload)
  if (!memberCode) throw new Error('El QR o código no es válido.')

  const { data, error } = await supabase.rpc('get_admin_club_member_by_qr', {
    p_payload: createClubCraftQrPayload(memberCode),
  })

  if (error) throw new Error(error.message)
  const member = parseRpcRow(data)
  if (!member) throw new Error('No encontramos un miembro con ese código.')

  return member
}

export async function createReward(formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  const input = parseRewardForm(formData)

  const { error } = await supabase.from('rewards').insert(input)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/club/rewards')
}

export async function updateReward(id: string, formData: FormData) {
  const { supabase } = await requireClubCraftAdmin()
  if (!id) throw new Error('Falta la recompensa.')
  const input = parseRewardForm(formData)

  const { error } = await supabase
    .from('rewards')
    .update(input)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/club/rewards')
}

// ── Promotions ───────────────────────────────────────────────────────────────

function parsePromotionForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const image_url = String(formData.get('image_url') ?? '').trim()
  const instagram_url = normalizeInstagramUrl(String(formData.get('instagram_url') ?? ''))
  const sort_order = Number(formData.get('sort_order'))
  const active = String(formData.get('active') ?? 'false') === 'true'

  if (!title) throw new Error('El título es obligatorio.')
  if (title.length > 80) throw new Error('El título debe ser corto.')
  if (!image_url) throw new Error('Sube o selecciona un póster.')
  if (!Number.isInteger(sort_order) || sort_order < 1 || sort_order > 6) {
    throw new Error('El orden debe ser un número del 1 al 6.')
  }

  if (!isCanonicalInstagramPostUrl(instagram_url)) {
    throw new Error('El link debe ser un post de Instagram: https://www.instagram.com/p/.../')
  }

  return { title, image_url, instagram_url, sort_order, active }
}

async function assertPromotionLimits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { sort_order: number; active: boolean },
  currentId?: string,
) {
  if (!input.active) return

  let activeQuery = supabase
    .from('promotions')
    .select('id')
    .eq('active', true)
  let orderQuery = supabase
    .from('promotions')
    .select('id')
    .eq('active', true)
    .eq('sort_order', input.sort_order)

  if (currentId) {
    activeQuery = activeQuery.neq('id', currentId)
    orderQuery = orderQuery.neq('id', currentId)
  }

  const { data: activePromotions, error: activeError } = await activeQuery
  if (activeError) throw new Error(activeError.message)
  if ((activePromotions ?? []).length >= 6) {
    throw new Error('Solo puede haber 6 promociones activas. Desactiva o elimina una antes.')
  }

  const { data: orderConflict, error: orderError } = await orderQuery.limit(1)
  if (orderError) throw new Error(orderError.message)
  if ((orderConflict ?? []).length > 0) {
    throw new Error('Ya existe una promoción activa con ese orden.')
  }
}

export async function createPromotion(formData: FormData) {
  const { supabase } = await requireSuperAdmin()
  const input = parsePromotionForm(formData)
  await assertPromotionLimits(supabase, input)

  const { error } = await supabase
    .from('promotions')
    .insert(input)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/promotions')
}

export async function updatePromotion(id: string, formData: FormData) {
  const { supabase } = await requireSuperAdmin()
  if (!id) throw new Error('Falta la promoción.')
  const input = parsePromotionForm(formData)
  await assertPromotionLimits(supabase, input, id)

  const { error } = await supabase
    .from('promotions')
    .update(input)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/promotions')
}

export async function deletePromotion(id: string) {
  const { supabase } = await requireSuperAdmin()
  if (!id) throw new Error('Falta la promoción.')

  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/promotions')
}
