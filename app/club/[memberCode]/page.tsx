import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClubCraftQrPayload, createClubCraftQrSvg, normalizeClubMemberCode } from '@/lib/club-craft-qr'
import type { ClubMemberPublicRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberCode: string }>
}) {
  const { memberCode } = await params
  return {
    title: `Club Craft ${normalizeClubMemberCode(memberCode)}`,
    description: 'Tarjeta digital Club Craft con QR de miembro.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

async function getPublicMember(memberCode: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_public_club_member_by_code', {
    p_member_code: normalizeClubMemberCode(memberCode),
  })

  if (error) throw new Error('No se pudo cargar Club Craft.')
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as ClubMemberPublicRow | null
}

export default async function ClubMemberPage({
  params,
}: {
  params: Promise<{ memberCode: string }>
}) {
  const { memberCode } = await params
  const member = await getPublicMember(memberCode)
  if (!member) notFound()

  const qr = createClubCraftQrSvg(member.member_code, { size: 220 })
  const qrPayload = createClubCraftQrPayload(member.member_code)

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col">
        <header className="border-b border-foreground/10 pb-6">
          <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
          <h1 className="display-tight mt-3 text-5xl">Craft Cervezas</h1>
        </header>

        <section className="my-6 border border-foreground/15 p-5">
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h2 className="display-tight mt-1 text-5xl">{member.first_name}</h2>
          <p className="mt-5 label-xs text-muted-foreground">PUNTOS DISPONIBLES</p>
          <p className="mt-2 font-mono text-5xl font-semibold">{member.points_balance}</p>
          <p className="mt-5 label-xs text-muted-foreground">MIEMBRO</p>
          <p className="mt-2 font-mono text-sm">{member.member_code}</p>

          <div className="mt-6 bg-white p-4" dangerouslySetInnerHTML={{ __html: qr.svg }} />
          <p className="mt-4 break-all font-mono text-[0.65rem] text-foreground/35">{qrPayload}</p>
        </section>

        {member.status === 'inactive' ? (
          <div className="border border-accent/40 bg-accent/10 p-4 text-sm text-accent">
            Esta cuenta Club Craft está inactiva. Habla con el equipo de Craft para más información.
          </div>
        ) : (
          <div className="border border-foreground/10 p-4 text-sm text-muted-foreground">
            Guarda esta página o toma screenshot del QR para acumular puntos en barra.
          </div>
        )}

        <footer className="mt-auto pt-8 text-center">
          <Link href="/" className="text-xs font-semibold tracking-widest text-foreground/45 hover:text-foreground">
            CRAFT CERVEZAS
          </Link>
        </footer>
      </div>
    </main>
  )
}
