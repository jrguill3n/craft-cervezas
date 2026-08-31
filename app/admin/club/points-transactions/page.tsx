import { redirect } from 'next/navigation'
import { PointsTransactionsManager } from '@/components/admin/club/points-transactions-manager'
import { canManageClubCraft } from '@/lib/admin-scope'
import type { PointsTransactionWithMember } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Transacciones de puntos — Club Craft' }
export const dynamic = 'force-dynamic'

export default async function PointsTransactionsPage() {
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

  const { data: transactions, error } = await supabase
    .from('points_transactions')
    .select('*, club_members(id, member_code, first_name, last_name, phone), created_by_profile:profiles!points_transactions_created_by_fkey(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`No se pudieron cargar las transacciones: ${error.message}`)

  return <PointsTransactionsManager transactions={(transactions ?? []) as PointsTransactionWithMember[]} />
}
