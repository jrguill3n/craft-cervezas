import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getKegHistory } from '@/lib/keg-history'
import { CRAFT_LOCATION_SLUGS } from '@/lib/admin-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function validBearerToken(request: NextRequest) {
  const expected = process.env.KEG_HISTORY_API_TOKEN
  const authorization = request.headers.get('authorization')
  if (!expected || !authorization?.startsWith('Bearer ')) return false

  const supplied = authorization.slice('Bearer '.length).trim()
  if (!supplied) return false

  const expectedHash = createHash('sha256').update(expected).digest()
  const suppliedHash = createHash('sha256').update(supplied).digest()
  return timingSafeEqual(expectedHash, suppliedHash)
}

function parseDate(value: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function isCraftLocation(value: string): value is (typeof CRAFT_LOCATION_SLUGS)[number] {
  return (CRAFT_LOCATION_SLUGS as readonly string[]).includes(value)
}

export async function GET(request: NextRequest) {
  if (!validBearerToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    })
  }

  const params = request.nextUrl.searchParams
  const location = params.get('location')?.trim().toLowerCase() || undefined
  if (location && !isCraftLocation(location)) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
  }

  const from = parseDate(params.get('from'))
  const to = parseDate(params.get('to'))
  if (from === null || to === null) {
    return NextResponse.json({ error: 'Invalid date filter' }, { status: 400 })
  }
  if (from && to && from > to) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  const statusParam = params.get('status')
  if (statusParam && statusParam !== 'open' && statusParam !== 'closed') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const requestedLimit = Number(params.get('limit') ?? 100)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return NextResponse.json({ error: 'Invalid limit' }, { status: 400 })
  }

  try {
    const data = await getKegHistory({
      location,
      from: from ?? undefined,
      to: to ?? undefined,
      status: statusParam as 'open' | 'closed' | undefined,
      limit: Math.min(requestedLimit, 200),
    })

    return NextResponse.json({ data, count: data.length }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('[keg-history-api] Query failed:', error)
    return NextResponse.json({ error: 'Could not load keg history' }, { status: 500 })
  }
}
