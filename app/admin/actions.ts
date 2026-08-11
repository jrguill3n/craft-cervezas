'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

// ── Tap List ─────────────────────────────────────────────────────────────────

export type TapListSaveItem = {
  beer_id: string
  tap_number: number | null
  badge: 'new' | 'limited' | 'guest' | 'house' | null
  price: number
}

export async function saveAndPublishTapList(locationId: string, items: TapListSaveItem[]) {
  const { supabase } = await requireAuth()
  if (!locationId) throw new Error('Falta la sucursal.')

  const tapNumbers = items
    .map((item) => item.tap_number)
    .filter((tapNumber): tapNumber is number => tapNumber !== null)
  if (tapNumbers.some((tapNumber) => !Number.isInteger(tapNumber) || tapNumber < 1 || tapNumber > 99)) {
    throw new Error('Los números de tap deben ser enteros entre 1 y 99.')
  }
  if (new Set(tapNumbers).size !== tapNumbers.length) {
    throw new Error('No puede haber dos cervezas con el mismo número de tap.')
  }
  for (const item of items) {
    if (!item.beer_id) throw new Error('Hay una cerveza inválida en el tap list.')
    if (!Number.isFinite(item.price) || item.price <= 0) throw new Error('Todos los precios deben ser mayores a cero.')
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
    .select('id, locations(slug)')
    .single()
  if (listError || !list) throw new Error(listError?.message ?? 'No se pudo guardar el tap list.')

  try {
    for (const [index, item] of items.entries()) {
      const { data: catalogPrice, error: priceReadError } = await supabase
        .from('serving_options')
        .select('id')
        .eq('beer_id', item.beer_id)
        .maybeSingle()
      if (priceReadError) throw priceReadError

      const priceMutation = catalogPrice
        ? supabase.from('serving_options').update({ label: 'Pinta', size: 'Pinta', price: item.price, display_order: 1 }).eq('id', catalogPrice.id)
        : supabase.from('serving_options').insert({ beer_id: item.beer_id, label: 'Pinta', size: 'Pinta', price: item.price, display_order: 1 })
      const { error: catalogPriceError } = await priceMutation
      if (catalogPriceError) throw catalogPriceError

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

  const slug = (list.locations as unknown as { slug: string } | null)?.slug
  if (slug) revalidatePath(`/${slug}`, 'page')
  revalidatePath('/admin')
}

// ── Beer CRUD ─────────────────────────────────────────────────────────────────

export async function createBeer(formData: FormData) {
  const { supabase } = await requireAuth()
  const name = String(formData.get('name') ?? '').trim()
  const brewery = String(formData.get('brewery') ?? '').trim()
  const style = String(formData.get('style') ?? '').trim()
  const abv = Number(formData.get('abv'))
  const price = Number(formData.get('price'))
  if (!name || !brewery || !style) throw new Error('Nombre, cervecería y estilo son obligatorios.')
  if (!Number.isFinite(abv) || abv < 0 || abv > 100) throw new Error('El ABV debe estar entre 0 y 100.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser mayor a cero.')
  const { data, error } = await supabase
    .from('beers')
    .insert({
      name,
      brewery,
      style,
      abv,
      description: (formData.get('description') as string) || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  const { error: priceError } = await supabase.from('serving_options').insert({
    beer_id: data.id,
    label: 'Pinta',
    size: 'Pinta',
    price,
    display_order: 1,
  })
  if (priceError) {
    await supabase.from('beers').delete().eq('id', data.id)
    throw new Error(priceError.message)
  }
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
  return data
}

export async function updateBeer(id: string, formData: FormData) {
  const { supabase } = await requireAuth()
  if (!id) throw new Error('Falta la cerveza que se quiere actualizar.')
  const name = String(formData.get('name') ?? '').trim()
  const brewery = String(formData.get('brewery') ?? '').trim()
  const style = String(formData.get('style') ?? '').trim()
  const abv = Number(formData.get('abv'))
  const price = Number(formData.get('price'))
  if (!name || !brewery || !style) throw new Error('Nombre, cervecería y estilo son obligatorios.')
  if (!Number.isFinite(abv) || abv < 0 || abv > 100) throw new Error('El ABV debe estar entre 0 y 100.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser mayor a cero.')
  const { error } = await supabase
    .from('beers')
    .update({
      name,
      brewery,
      style,
      abv,
      description: (formData.get('description') as string) || null,
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
}

export async function deleteBeer(id: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('beers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/beers')
}
