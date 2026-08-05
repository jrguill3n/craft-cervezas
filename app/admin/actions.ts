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
  const { data, error } = await supabase
    .from('tap_lists')
    .insert({ location_id: locationId, status: 'draft' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return data
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
  const defaultPrice = formData.get('default_price') ? Number(formData.get('default_price')) : null

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
  if (defaultPrice && defaultPrice > 0) {
    await supabase.from('serving_options').insert({
      tap_list_item_id: data.id,
      label: 'Vaso',
      size: 'Vaso',
      price: defaultPrice,
      display_order: 1,
    })
  }

  revalidatePath('/admin')
  return data
}

export async function removeTapListItem(itemId: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('tap_list_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateItemAvailability(itemId: string, status: 'available' | 'unavailable') {
  const { supabase } = await requireAuth()
  const { error } = await supabase
    .from('tap_list_items')
    .update({ availability_status: status })
    .eq('id', itemId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateItemBadge(itemId: string, badge: string | null) {
  const { supabase } = await requireAuth()
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

// ── Beer CRUD ─────────────────────────────────────────────────────────────────

export async function createBeer(formData: FormData) {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('beers')
    .insert({
      name: formData.get('name') as string,
      brewery: formData.get('brewery') as string,
      style: formData.get('style') as string,
      abv: Number(formData.get('abv')),
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
  const { error } = await supabase
    .from('beers')
    .update({
      name: formData.get('name') as string,
      brewery: formData.get('brewery') as string,
      style: formData.get('style') as string,
      abv: Number(formData.get('abv')),
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
