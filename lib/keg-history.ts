import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { CRAFT_LOCATION_SLUGS } from '@/lib/admin-scope'

export type KegHistoryFilters = {
  location?: string
  from?: string
  to?: string
  status?: 'open' | 'closed'
  limit: number
}

export async function getKegHistory(filters: KegHistoryFilters) {
  const supabase = createAdminClient()
  const allowedSlugs = filters.location
    ? CRAFT_LOCATION_SLUGS.filter((slug) => slug === filters.location)
    : [...CRAFT_LOCATION_SLUGS]

  if (allowedSlugs.length === 0) return []

  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id')
    .in('slug', allowedSlugs)

  if (locationsError) throw new Error(locationsError.message)
  const locationIds = (locations ?? []).map((location) => location.id)
  if (locationIds.length === 0) return []

  let query = supabase
    .from('keg_connections')
    .select(`
      id,
      tap_number,
      connected_at,
      disconnected_at,
      locations!inner(name, slug),
      beers!inner(name, brewery, style),
      connected_by_profile:profiles!keg_connections_connected_by_fkey(full_name),
      disconnected_by_profile:profiles!keg_connections_disconnected_by_fkey(full_name)
    `)
    .in('location_id', locationIds)
    .order('connected_at', { ascending: false })
    .limit(filters.limit)

  if (filters.from) query = query.gte('connected_at', filters.from)
  if (filters.to) query = query.lte('connected_at', filters.to)
  if (filters.status === 'open') query = query.is('disconnected_at', null)
  if (filters.status === 'closed') query = query.not('disconnected_at', 'is', null)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    location: row.locations?.name ?? null,
    location_slug: row.locations?.slug ?? null,
    tap_number: row.tap_number,
    beer: row.beers?.name ?? null,
    brewery: row.beers?.brewery ?? null,
    style: row.beers?.style ?? null,
    connected_at: row.connected_at,
    disconnected_at: row.disconnected_at,
    connected_by: row.connected_by_profile?.full_name ?? null,
    disconnected_by: row.disconnected_by_profile?.full_name ?? null,
  }))
}
