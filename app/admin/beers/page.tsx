import { createClient } from '@/lib/supabase/server'
import { BeersEditor } from '@/components/admin/beers-editor'
import type { BeerRow } from '@/lib/db-types'
import { getManageableLocationIds } from '@/lib/admin-scope'

export const metadata = { title: 'Cervezas — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminBeersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <BeersEditor beers={[]} />
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(`No se pudo cargar el perfil: ${profileError.message}`)
  }

  if (!profile?.active) {
    return <BeersEditor beers={[]} />
  }

  const locationIds = await getManageableLocationIds(supabase, profile)
  if (locationIds.length === 0) {
    return <BeersEditor beers={[]} />
  }

  let beersQuery: any = supabase
    .from('beers')
    .select('id, name, brewery, style, abv, description, created_at, updated_at, beer_locations!inner(location_id), serving_options(price, display_order)')
    .in('beer_locations.location_id', locationIds)

  const { data: beers, error } = await beersQuery
    .order('name')

  if (error) {
    throw new Error(`No se pudo cargar el catálogo de cervezas: ${error.message}`)
  }

  const beersWithPrice = (beers ?? []).map((beer: any) => ({
    ...beer,
    primary_price: (beer.serving_options ?? [])
      .slice()
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)[0]?.price ?? null,
  }))

  const uniqueBeers = Array.from(new Map(beersWithPrice.map((beer: BeerRow) => [beer.id, beer])).values())

  return <BeersEditor beers={uniqueBeers as BeerRow[]} />
}
