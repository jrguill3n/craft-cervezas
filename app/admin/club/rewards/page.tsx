import { redirect } from 'next/navigation'
import { RewardsManager } from '@/components/admin/club/rewards-manager'
import { canManageClubCraft } from '@/lib/admin-scope'
import type { RewardRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Recompensas — Club Craft' }
export const dynamic = 'force-dynamic'

export default async function ClubRewardsPage() {
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
    .order('points_cost')

  if (error) throw new Error(`No se pudieron cargar las recompensas: ${error.message}`)

  return <RewardsManager rewards={(rewards ?? []) as RewardRow[]} />
}
