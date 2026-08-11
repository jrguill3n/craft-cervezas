import { createClient } from '@/lib/supabase/server'
import type { TapListFull } from '@/lib/db-types'
import { compareTapListItems } from '@/lib/tap-list-order'

/**
 * Returns the most recently published tap list for a given location slug.
 * Used by the public-facing site — no auth required (respects the
 * `tap_lists_public_read` RLS policy).
 */
export async function getPublishedTapList(slug: string): Promise<TapListFull | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tap_lists')
    .select(`
      *,
      locations!inner(*),
      tap_list_items(
        *,
        beers(*),
        serving_options(*)
      )
    `)
    .eq('locations.slug', slug)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`[tap-list] Could not load published list for ${slug}:`, error)
    throw new Error(`No se pudo cargar el tap list publicado de ${slug}.`)
  }

  if (!data) return null

  data.tap_list_items = (data.tap_list_items ?? [])
    .filter((i: { availability_status: string }) => i.availability_status === 'available')
    .sort(compareTapListItems)

  return data as TapListFull
}

/**
 * Returns published tap lists for all active locations.
 * Used by the public tap list section that shows all branches at once.
 */
export async function getAllPublishedTapLists(): Promise<TapListFull[]> {
  const supabase = await createClient()

  const { data: locations, error } = await supabase
    .from('locations')
    .select('slug')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('[tap-list] Could not load active locations:', error)
    throw new Error('No se pudieron cargar las sucursales activas.')
  }

  if (!locations?.length) return []

  const results = await Promise.all(
    locations.map((l: { slug: string }) => getPublishedTapList(l.slug)),
  )

  return results.filter(Boolean) as TapListFull[]
}
