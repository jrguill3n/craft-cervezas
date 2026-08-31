import { redirect } from 'next/navigation'
import { ClubScanner } from '@/components/admin/club/club-scanner'
import { canManageClubCraft } from '@/lib/admin-scope'
import type { RewardRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Scanner — Club Craft' }
export const dynamic = 'force-dynamic'

export default async function ClubScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .single()

  if (!profile?.active) redirect('/auth/login')
  if (!(await canManageClubCraft(supabase, profile))) redirect('/admin')

  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('points_cost')

  if (error) throw new Error(`No se pudieron cargar las recompensas: ${error.message}`)

  return <ClubScanner rewards={(rewards ?? []) as RewardRow[]} />
}
