import { createClient } from '@/lib/supabase/server'
import { BeersEditor } from '@/components/admin/beers-editor'
import type { BeerRow } from '@/lib/db-types'

export const metadata = { title: 'Cervezas — Admin Craft' }
export const dynamic = 'force-dynamic'

export default async function AdminBeersPage() {
  const supabase = await createClient()
  const { data: beers, error } = await supabase
    .from('beers')
    .select('id, name, brewery, style, abv, default_price, description, created_at, updated_at')
    .order('name')

  if (error) {
    throw new Error(`No se pudo cargar el catálogo de cervezas: ${error.message}`)
  }

  return <BeersEditor beers={(beers ?? []) as BeerRow[]} />
}
