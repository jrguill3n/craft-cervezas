import { redirect } from 'next/navigation'
import { MembersManager } from '@/components/admin/club/members-manager'
import { canManageClubCraft } from '@/lib/admin-scope'
import type { ClubMemberRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Miembros — Club Craft' }
export const dynamic = 'force-dynamic'

export default async function ClubMembersPage() {
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

  const { data: members, error } = await supabase
    .from('club_members')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`No se pudieron cargar los miembros: ${error.message}`)

  return <MembersManager members={(members ?? []) as ClubMemberRow[]} />
}
