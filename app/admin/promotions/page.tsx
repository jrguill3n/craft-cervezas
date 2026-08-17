import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PromotionsEditor } from '@/components/admin/promotions-editor'
import type { PromotionRow } from '@/lib/db-types'

export const metadata = { title: 'Promociones — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPromotionsPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(`No se pudo cargar el perfil: ${profileError.message}`)
  if (!profile?.active) redirect('/auth/login')

  if (profile.role !== 'super_admin') {
    return (
      <div className="p-6 md:p-10">
        <p className="label-xs text-muted-foreground">PROMOCIONES</p>
        <h1 className="display-tight mt-2 text-4xl md:text-5xl">Sin acceso</h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Solo los super admins pueden administrar promociones y eventos.
        </p>
      </div>
    )
  }

  const { data: promotions, error } = await supabase
    .from('promotions')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`No se pudieron cargar las promociones: ${error.message}`)

  return (
    <PromotionsEditor
      promotions={(promotions ?? []) as PromotionRow[]}
      supabaseConfig={{ url, anonKey }}
    />
  )
}
