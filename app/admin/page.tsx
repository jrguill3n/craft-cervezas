import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TapListEditor } from '@/components/admin/tap-list-editor'
import type { LocationRow, ProfileRow, TapListFull } from '@/lib/db-types'

export const metadata = { title: 'Tap List — Admin Craft' }
export const dynamic = 'force-dynamic'

export default async function AdminTapListPage() {
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

  // For each location, return the draft when it exists. A published list is
  // read-only in the editor until create_draft_tap_list clones it.
  const tapListsWithItems: TapListFull[] = []
  for (const loc of locations ?? []) {
    let { data: tapList, error: draftError } = await supabase
      .from('tap_lists')
      .select(`
        *,
        locations(*),
        tap_list_items(
          *,
          beers(*),
          serving_options(*)
        )
      `)
      .eq('location_id', loc.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (draftError) throw new Error(`No se pudo cargar el borrador de ${loc.name}: ${draftError.message}`)

    if (!tapList) {
      const { data: published, error: publishedError } = await supabase
        .from('tap_lists')
        .select(`
          *,
          locations(*),
          tap_list_items(
            *,
            beers(*),
            serving_options(*)
          )
        `)
        .eq('location_id', loc.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (publishedError) throw new Error(`No se pudo cargar el tap list de ${loc.name}: ${publishedError.message}`)
      tapList = published
    }

    if (tapList) {
      // Sort items by display_order
      tapList.tap_list_items = (tapList.tap_list_items ?? []).sort(
        (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order,
      )
      tapListsWithItems.push(tapList as TapListFull)
    }
  }

  // All beers for the "add beer" selector
  const { data: allBeers, error: beersError } = await supabase
    .from('beers')
    .select('id, name, brewery, style, abv, default_price, description, created_at, updated_at')
    .order('name')
  if (beersError) throw new Error(`No se pudo cargar el catálogo de cervezas: ${beersError.message}`)

  return (
    <TapListEditor
      locations={(locations ?? []) as LocationRow[]}
      tapLists={tapListsWithItems}
      allBeers={(allBeers ?? []) as import('@/lib/db-types').BeerRow[]}
      profile={profile as ProfileRow}
    />
  )
}
