import { createClient } from '@/lib/supabase/server'
import { BeersEditor } from '@/components/admin/beers-editor'
import type { BeerRow } from '@/lib/db-types'

export const metadata = { title: 'Cervezas — Admin Craft' }
export const dynamic = 'force-dynamic'

export default async function AdminBeersPage() {
  const supabase = await createClient()
  const { data: beers, error } = await supabase
    .from('beers')
    .select('id, name, brewery, style, abv, description, created_at, updated_at, serving_options(price, display_order)')
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

  return <BeersEditor beers={beersWithPrice as BeerRow[]} />
}
