import { notFound, redirect } from 'next/navigation'
import { MemberDetail } from '@/components/admin/club/member-detail'
import { canManageClubCraft } from '@/lib/admin-scope'
import type { ClubMemberRow, PointsTransactionWithMember, RewardRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Miembro — Club Craft' }
export const dynamic = 'force-dynamic'

export default async function ClubMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: member, error: memberError } = await supabase
    .from('club_members')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (memberError) throw new Error(`No se pudo cargar el miembro: ${memberError.message}`)
  if (!member) notFound()

  const { data: transactions, error: transactionsError } = await supabase
    .from('points_transactions')
    .select('*, created_by_profile:profiles!points_transactions_created_by_fkey(id, full_name)')
    .eq('member_id', id)
    .order('created_at', { ascending: false })

  if (transactionsError) {
    throw new Error(`No se pudo cargar el historial de puntos: ${transactionsError.message}`)
  }

  const { data: rewards, error: rewardsError } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('points_cost')

  if (rewardsError) {
    throw new Error(`No se pudieron cargar las recompensas: ${rewardsError.message}`)
  }

  return (
    <MemberDetail
      member={member as ClubMemberRow}
      transactions={(transactions ?? []) as PointsTransactionWithMember[]}
      rewards={(rewards ?? []) as RewardRow[]}
    />
  )
}
