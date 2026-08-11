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
  if (items.some((item, index) => item.tap_number !== index + 1)) {
    throw new Error('El orden y el número de tap deben coincidir consecutivamente desde 1.')
  }
  for (const item of items) {
    if (!item.beer_id) throw new Error('Hay una cerveza inválida en el tap list.')
  }

  const beerIds = [...new Set(items.map((item) => item.beer_id))]
  if (beerIds.length > 0) {
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
    .select('id, locations(slug)')
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
