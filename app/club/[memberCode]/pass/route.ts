import { NextResponse } from 'next/server'
import { generateClubCraftPass, getPublicWalletStatusMessage } from '@/lib/apple-wallet'
import { normalizeClubMemberCode } from '@/lib/club-craft-qr'
import type { ClubMemberPublicRow } from '@/lib/db-types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getPublicMember(memberCode: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_public_club_member_by_code', {
    p_member_code: normalizeClubMemberCode(memberCode),
  })

  if (error) return null
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as ClubMemberPublicRow | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberCode: string }> },
) {
  const { memberCode } = await params
  const member = await getPublicMember(memberCode)

  if (!member) {
    return NextResponse.json({ error: 'No encontramos esa tarjeta Club Craft.' }, { status: 404 })
  }

  if (member.status !== 'active') {
    return NextResponse.json({ error: 'Esta tarjeta Club Craft está inactiva.' }, { status: 403 })
  }

  try {
    const pass = await generateClubCraftPass(member)
    return new NextResponse(pass, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="club-craft-${member.member_code}.pkpass"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: getPublicWalletStatusMessage() }, { status: 501 })
  }
}
