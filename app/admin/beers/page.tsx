import { createClient } from '@/lib/supabase/server'
import { BeersEditor } from '@/components/admin/beers-editor'
import type { BeerRow } from '@/lib/db-types'

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

  const isSuperAdmin = profile.role === 'super_admin'
  let locationIds: string[] = []

  if (!isSuperAdmin) {
    const { data: assignedLocations, error: assignedLocationsError } = await supabase
      .from('profile_locations')
      .select('location_id')
      .eq('profile_id', profile.id)

    if (assignedLocationsError) {
      throw new Error(`No se pudieron cargar las sucursales asignadas: ${assignedLocationsError.message}`)
    }

    locationIds = (assignedLocations ?? []).map((row) => row.location_id as string)

    if (locationIds.length === 0) {
      return <BeersEditor beers={[]} />
    }
  }

  const beersSelect = isSuperAdmin
    ? 'id, name, brewery, style, abv, description, created_at, updated_at, serving_options(price, display_order)'
    : 'id, name, brewery, style, abv, description, created_at, updated_at, beer_locations!inner(location_id), serving_options(price, display_order)'

  let beersQuery: any = supabase
    .from('beers')
    .select(beersSelect)

  if (!isSuperAdmin) {
    beersQuery = beersQuery.in('beer_locations.location_id', locationIds)
  }

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
