import { createClient } from '@/lib/supabase/server'
import { BeersEditor } from '@/components/admin/beers-editor'
import type { BeerRow } from '@/lib/db-types'

export const metadata = { title: 'Cervezas — Admin Craft' }

export default async function AdminBeersPage() {
  const supabase = await createClient()
  const { data: beers } = await supabase
    .from('beers')
    .select('*')
    .order('name')

  return <BeersEditor beers={(beers ?? []) as BeerRow[]} />
}
