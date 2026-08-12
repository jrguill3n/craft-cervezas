import { createPublicClient } from '@/lib/supabase/public'
import type { TapListFull, TapListItemFull } from '@/lib/db-types'
import { compareTapListItems } from '@/lib/tap-list-order'

const PUBLIC_LOCATION_ORDER = ['americana', 'chapalita', 'providencia']

type RawTapListItem = TapListItemFull & {
  beers: TapListItemFull['beers'] & {
    serving_options?: TapListItemFull['serving_options']
  }
}

type RawTapList = Omit<TapListFull, 'tap_list_items'> & {
  tap_list_items: RawTapListItem[]
}

/**
 * Returns the most recently published tap list for a given location slug.
 * Used by the public-facing site — no auth required (respects the
 * `tap_lists_public_read` RLS policy).
 */
export async function getPublishedTapList(slug: string): Promise<TapListFull | null> {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('tap_lists')
    .select(`
      *,
      locations!inner(*),
      tap_list_items(
        *,
        beers(*, serving_options(*))
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
    .map((item: { beers?: { serving_options?: unknown[] } }) => ({
      ...item,
      serving_options: item.beers?.serving_options ?? [],
    }))
    .sort(compareTapListItems)

  return data as TapListFull
}

/**
 * Returns published tap lists for all active locations.
 * Used by the public tap list section that shows all branches at once.
 */
export async function getAllPublishedTapLists(): Promise<TapListFull[]> {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('tap_lists')
    .select(`
      *,
      locations!inner(*),
      tap_list_items(
        *,
        beers(*, serving_options(*))
      )
    `)
    .eq('status', 'published')
    .eq('locations.active', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[tap-list] Could not load published tap lists:', error)
    throw new Error('No se pudieron cargar los tap lists publicados.')
  }

  if (!data?.length) return []

  const latestByLocation = new Map<string, TapListFull>()

  for (const rawList of data as RawTapList[]) {
    const list = rawList as TapListFull
    const slug = list.locations.slug
    if (!PUBLIC_LOCATION_ORDER.includes(slug)) continue
    if (latestByLocation.has(slug)) continue

    list.tap_list_items = (rawList.tap_list_items ?? [])
      .map((item) => ({
        ...item,
        serving_options: item.beers?.serving_options ?? [],
      }))
      .sort(compareTapListItems)

    latestByLocation.set(slug, list)
  }

  return [...latestByLocation.values()].sort((a, b) => {
    const aIndex = PUBLIC_LOCATION_ORDER.indexOf(a.locations.slug)
    const bIndex = PUBLIC_LOCATION_ORDER.indexOf(b.locations.slug)
    return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex)
      - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
  })
}
