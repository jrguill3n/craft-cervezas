import { redirect } from 'next/navigation'
import { getManageableLocations } from '@/lib/admin-scope'
import { createClient } from '@/lib/supabase/server'
import type { KegConnectionFull } from '@/lib/db-types'
import { KegHistoryManager } from '@/components/admin/keg-history-manager'

export const metadata = { title: 'Historial de barriles — Admin' }
export const dynamic = 'force-dynamic'

export default async function KegHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active) redirect('/auth/login')

  const locations = await getManageableLocations(supabase, profile)
  const locationIds = locations.map((location) => location.id)

  const { data, error } = locationIds.length > 0
    ? await supabase
      .from('keg_connections')
      .select(`
        *,
        locations!inner(id, name, slug),
        beers!inner(id, name, brewery, style),
        connected_by_profile:profiles!keg_connections_connected_by_fkey(id, full_name),
        disconnected_by_profile:profiles!keg_connections_disconnected_by_fkey(id, full_name)
      `)
      .in('location_id', locationIds)
      .order('connected_at', { ascending: false })
      .limit(500)
    : { data: [], error: null }

  if (error) throw new Error(`No se pudo cargar el historial de barriles: ${error.message}`)

  return (
    <KegHistoryManager
      connections={(data ?? []) as KegConnectionFull[]}
      locations={locations}
    />
  )
}
