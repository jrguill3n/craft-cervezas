import { createClient } from '@/lib/supabase/server'
import type { LocationRow, ProfileRow } from '@/lib/db-types'

export const CRAFT_LOCATION_SLUGS = ['americana', 'chapalita', 'providencia'] as const

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type AdminProfile = Pick<ProfileRow, 'id' | 'role'>

export async function getManageableLocations(
  supabase: SupabaseClient,
  profile: AdminProfile,
) {
  let locationsQuery = supabase.from('locations').select('*').eq('active', true)

  if (profile.role === 'super_admin') {
    locationsQuery = locationsQuery.in('slug', CRAFT_LOCATION_SLUGS)
  } else {
    const locationIds = await getAssignedLocationIds(supabase, profile.id)
    if (locationIds.length === 0) return []
    locationsQuery = locationsQuery.in('id', locationIds)
  }

  const { data, error } = await locationsQuery.order('name')
  if (error) throw new Error(`No se pudieron cargar las sucursales: ${error.message}`)

  return (data ?? []) as LocationRow[]
}

export async function getManageableLocationIds(
  supabase: SupabaseClient,
  profile: AdminProfile,
) {
  const locations = await getManageableLocations(supabase, profile)
  return locations.map((location) => location.id)
}

async function getAssignedLocationIds(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from('profile_locations')
    .select('location_id')
    .eq('profile_id', profileId)

  if (error) throw new Error(`No se pudieron cargar las sucursales asignadas: ${error.message}`)

  return (data ?? []).map((row) => row.location_id as string)
}

