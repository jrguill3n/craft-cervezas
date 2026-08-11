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

export async function createDraftTapList(locationId: string) {
  const { supabase } = await requireAuth()
  const { data: existingDraft, error: draftLookupError } = await supabase
    .from('tap_lists')
    .select('id')
    .eq('location_id', locationId)
    .eq('status', 'draft')
    .maybeSingle()
  if (draftLookupError) throw new Error(draftLookupError.message)
  if (existingDraft) return existingDraft.id

  const { data: published, error: publishedError } = await supabase
    .from('tap_lists')
    .select('id')
    .eq('location_id', locationId)
    .eq('status', 'published')
    .maybeSingle()
  if (publishedError) throw new Error(publishedError.message)

  const { data: draft, error: createError } = await supabase
    .from('tap_lists')
    .insert({ location_id: locationId, status: 'draft' })
    .select('id')
    .single()
  if (createError || !draft) {
    throw new Error(createError?.message ?? 'No se pudo crear el borrador.')
  }

  try {
    if (published) {
      const { data: publishedItems, error: itemsError } = await supabase
        .from('tap_list_items')
        .select('beer_id, tap_number, availability_status, badge, display_order, beers(default_price), serving_options(label, size, price, display_order)')
        .eq('tap_list_id', published.id)
        .order('display_order')
      if (itemsError) throw itemsError

      for (const item of publishedItems ?? []) {
        const { data: copiedItem, error: itemError } = await supabase
          .from('tap_list_items')
          .insert({
            tap_list_id: draft.id,
            beer_id: item.beer_id,
            tap_number: item.tap_number,
            availability_status: item.availability_status,
            badge: item.badge,
            display_order: item.display_order,
          })
          .select('id')
          .single()
        if (itemError || !copiedItem) throw itemError ?? new Error('No se pudo copiar una cerveza.')

        const inheritedOptions = (item.serving_options ?? []).map((option) => ({
          tap_list_item_id: copiedItem.id,
          label: option.label,
          size: option.size,
          price: Number(option.price),
          display_order: option.display_order,
        }))
        const beer = item.beers as unknown as { default_price: number | null } | null
        const options = inheritedOptions.length
          ? inheritedOptions
          : beer?.default_price
            ? [{ tap_list_item_id: copiedItem.id, label: 'Vaso', size: 'Vaso', price: Number(beer.default_price), display_order: 1 }]
            : []

        if (options.length) {
          const { error: optionsError } = await supabase.from('serving_options').insert(options)
          if (optionsError) throw optionsError
        }
      }
    }
  } catch (error) {
    await supabase.from('tap_lists').delete().eq('id', draft.id)
    const message = error instanceof Error ? error.message : 'No se pudo preparar la edición del tap list.'
    throw new Error(message)
  }

  revalidatePath('/admin')
  return draft.id
}

export async function publishTapList(tapListId: string) {
  const { supabase, user } = await requireAuth()

  // Atomic: archives any existing published list for this location before publishing
  const { error } = await supabase.rpc('publish_tap_list', {
    p_tap_list_id: tapListId,
    p_user_id: user.id,
  })
  if (error) throw new Error(error.message)

  // Revalidate the public sucursal page
  const { data: tl } = await supabase
    .from('tap_lists')
    .select('locations(slug)')
    .eq('id', tapListId)
    .single()
  const slug = (tl?.locations as unknown as { slug: string } | null)?.slug
  if (slug) revalidatePath(`/${slug}`, 'page')
  revalidatePath('/admin')
}

export async function unpublishTapList(tapListId: string) {
  const { supabase } = await requireAuth()

  const { data: tl } = await supabase
    .from('tap_lists')
    .select('locations(slug)')
    .eq('id', tapListId)
    .single()

  const { error } = await supabase
    .from('tap_lists')
    .update({ status: 'draft', published_at: null, published_by: null })
    .eq('id', tapListId)
  if (error) throw new Error(error.message)

  const slug = (tl?.locations as unknown as { slug: string } | null)?.slug
  if (slug) revalidatePath(`/${slug}`, 'page')
  revalidatePath('/admin')
}

// ── Tap List Items ────────────────────────────────────────────────────────────

export async function addTapListItem(formData: FormData) {
  const { supabase } = await requireAuth()
  const tapListId = formData.get('tap_list_id') as string
  const beerId = formData.get('beer_id') as string
  const tapNumber = formData.get('tap_number') ? Number(formData.get('tap_number')) : null
  const badge = (formData.get('badge') as string) || null

  if (!tapListId || !beerId) throw new Error('Faltan datos para agregar la cerveza.')

  const { data: beer, error: beerError } = await supabase
    .from('beers')
    .select('default_price')
    .eq('id', beerId)
    .single()
  const defaultPrice = Number(beer?.default_price)
  if (beerError || !defaultPrice || defaultPrice <= 0) {
    throw new Error('Esta cerveza no tiene precio. Edítala antes de agregarla al tap list.')
  }

  const { data: editableList, error: listError } = await supabase
    .from('tap_lists')
    .select('status')
    .eq('id', tapListId)
    .single()
  if (listError || editableList?.status !== 'draft') {
    throw new Error('Solo se puede editar un borrador.')
  }

  // Determine display_order
  const { count } = await supabase
    .from('tap_list_items')
    .select('id', { count: 'exact', head: true })
    .eq('tap_list_id', tapListId)

  const { data, error } = await supabase
    .from('tap_list_items')
    .insert({
      tap_list_id: tapListId,
      beer_id: beerId,
      tap_number: tapNumber,
      badge,
      display_order: count ?? 0,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Auto-create default serving option "Vaso" if a price was provided
  if (defaultPrice > 0) {
    const { error: priceError } = await supabase.from('serving_options').insert({
      tap_list_item_id: data.id,
      label: 'Vaso',
      size: 'Vaso',
      price: defaultPrice,
      display_order: 1,
    })
    if (priceError) {
      await supabase.from('tap_list_items').delete().eq('id', data.id)
      throw new Error(priceError.message)
    }
  }

  revalidatePath('/admin')
  return data
}

export async function removeTapListItem(itemId: string) {
  const { supabase } = await requireAuth()
  await assertDraftItem(supabase, itemId)
  const { error } = await supabase.from('tap_list_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateItemAvailability(itemId: string, status: 'available' | 'unavailable') {
  const { supabase } = await requireAuth()
  await assertDraftItem(supabase, itemId)
  const { error } = await supabase
    .from('tap_list_items')
    .update({ availability_status: status })
    .eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateItemBadge(itemId: string, badge: string | null) {
  const { supabase } = await requireAuth()
  await assertDraftItem(supabase, itemId)
  const { error } = await supabase
    .from('tap_list_items')
    .update({ badge })
    .eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Serving Options ───────────────────────────────────────────────────────────

export async function upsertServingOptions(
  itemId: string,
  options: { id?: string; label: string; size: string; price: number; display_order: number }[],
) {
  const { supabase } = await requireAuth()
  await assertDraftItem(supabase, itemId)

  // Delete removed options (those not in the new list)
  const keepIds = options.filter((o) => o.id).map((o) => o.id!)
  if (keepIds.length > 0) {
    await supabase
      .from('serving_options')
      .delete()
      .eq('tap_list_item_id', itemId)
      .not('id', 'in', `(${keepIds.map((id) => `"${id}"`).join(',')})`)
  } else {
    await supabase.from('serving_options').delete().eq('tap_list_item_id', itemId)
  }

  for (const opt of options) {
    if (opt.id) {
      await supabase
        .from('serving_options')
        .update({ label: opt.label, size: opt.size, price: opt.price, display_order: opt.display_order })
        .eq('id', opt.id)
    } else {
      await supabase.from('serving_options').insert({
        tap_list_item_id: itemId,
        label: opt.label,
        size: opt.size,
        price: opt.price,
        display_order: opt.display_order,
      })
    }
  }

  revalidatePath('/admin')
}

async function assertDraftItem(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string) {
  const { data, error } = await supabase
    .from('tap_list_items')
    .select('tap_lists!inner(status)')
    .eq('id', itemId)
    .single()
  const tapList = data?.tap_lists as unknown as { status: string } | null
  if (error || tapList?.status !== 'draft') throw new Error('Solo se puede editar un borrador.')
}

// ── Beer CRUD ─────────────────────────────────────────────────────────────────

export async function createBeer(formData: FormData) {
  const { supabase } = await requireAuth()
  const defaultPrice = Number(formData.get('price'))
  if (!defaultPrice || defaultPrice <= 0) throw new Error('El precio debe ser mayor a cero.')
  const { data, error } = await supabase
    .from('beers')
    .insert({
      name: formData.get('name') as string,
      brewery: formData.get('brewery') as string,
      style: formData.get('style') as string,
      abv: Number(formData.get('abv')),
      default_price: defaultPrice,
      description: (formData.get('description') as string) || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
  return data
}

export async function updateBeer(id: string, formData: FormData) {
  const { supabase } = await requireAuth()
  const defaultPrice = Number(formData.get('price'))
  if (!defaultPrice || defaultPrice <= 0) throw new Error('El precio debe ser mayor a cero.')
  const { error } = await supabase
    .from('beers')
    .update({
      name: formData.get('name') as string,
      brewery: formData.get('brewery') as string,
      style: formData.get('style') as string,
      abv: Number(formData.get('abv')),
      default_price: defaultPrice,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/beers')
}

export async function deleteBeer(id: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('beers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/beers')
}
