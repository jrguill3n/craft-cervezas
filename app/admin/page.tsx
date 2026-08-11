import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TapListEditor } from '@/components/admin/tap-list-editor'
import type { BeerRow, LocationRow, ProfileRow, TapListFull } from '@/lib/db-types'
import { compareTapListItems } from '@/lib/tap-list-order'

export const metadata = { title: 'Tap List — Admin Craft' }
export const dynamic = 'force-dynamic'

export default async function AdminTapListPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const { location: requestedLocation } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active) redirect('/auth/login')

  // Locations this user can manage
  let locationsQuery = supabase.from('locations').select('*').eq('active', true)
  if (profile.role !== 'super_admin') {
    const { data: pl } = await supabase
      .from('profile_locations')
      .select('location_id')
      .eq('profile_id', user.id)
    const ids = (pl ?? []).map((r: { location_id: string }) => r.location_id)
    if (ids.length === 0) return <p className="p-10 text-muted-foreground">Sin locaciones asignadas.</p>
    locationsQuery = locationsQuery.in('id', ids)
  }

  const { data: locations, error: locationsError } = await locationsQuery.order('name')
  if (locationsError) throw new Error(`No se pudieron cargar las sucursales: ${locationsError.message}`)

  // The editor always starts from the currently published list. Changes stay
  // in the browser until the user explicitly saves and publishes them.
  const tapListsWithItems: TapListFull[] = []
  for (const loc of locations ?? []) {
    const { data: tapList, error: tapListError } = await supabase
      .from('tap_lists')
      .select(`
        *,
        locations(*),
        tap_list_items(
          *,
          beers(*, serving_options(*))
        )
      `)
      .eq('location_id', loc.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (tapListError) throw new Error(`No se pudo cargar el tap list de ${loc.name}: ${tapListError.message}`)

    if (tapList) {
      tapList.tap_list_items = (tapList.tap_list_items ?? []).map((item: any) => ({
        ...item,
        serving_options: item.beers?.serving_options ?? [],
      })).sort(compareTapListItems)
      tapListsWithItems.push(tapList as TapListFull)
    }
  }

  // All beers for the "add beer" selector
  const { data: allBeers, error: beersError } = await supabase
    .from('beers')
    .select('id, name, brewery, style, abv, description, created_at, updated_at, serving_options(price, display_order)')
    .order('name')
  if (beersError) throw new Error(`No se pudo cargar el catálogo de cervezas: ${beersError.message}`)

  const beersWithPrice = (allBeers ?? []).map((beer: any) => ({
    ...beer,
    primary_price: (beer.serving_options ?? [])
      .slice()
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)[0]?.price ?? null,
  }))
  const initialLocationId = (locations ?? []).find((location) => location.slug === requestedLocation)?.id
    ?? locations?.[0]?.id
    ?? ''

  return (
    <TapListEditor
      locations={(locations ?? []) as LocationRow[]}
      tapLists={tapListsWithItems}
      allBeers={beersWithPrice as BeerRow[]}
      profile={profile as ProfileRow}
      initialLocationId={initialLocationId}
    />
  )
}
