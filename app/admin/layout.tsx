import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const metadata = {
  title: 'Admin',
  robots: 'noindex,nofollow',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el servidor.',
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.active) redirect('/auth/login')

  const { data: assignedLocations } = await supabase
    .from('profile_locations')
    .select('locations(name, slug)')
    .eq('profile_id', user.id)

  const managerLocations = (assignedLocations ?? [])
    .map((row: any) => Array.isArray(row.locations) ? row.locations[0] : row.locations)
    .filter((location: unknown): location is { name: string; slug: string } => {
      return Boolean(location && typeof location === 'object' && 'name' in location && 'slug' in location)
    })

  const insurgenteOnly =
    profile.role === 'location_manager' &&
    managerLocations.length === 1 &&
    managerLocations[0]?.slug === 'insurgente-gdl'

  const adminBrand = insurgenteOnly
    ? { title: 'INSURGENTE GDL', subtitle: 'ADMIN' }
    : { title: 'CRAFT', subtitle: 'ADMIN' }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background xl:flex-row">
      <AdminSidebar profile={profile} supabaseConfig={{ url, anonKey }} adminBrand={adminBrand} />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none xl:overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
