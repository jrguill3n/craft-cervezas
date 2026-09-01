import QRCode from 'qrcode'

export const CLUB_CRAFT_QR_PREFIX = 'clubcraft:'
export const CLUB_MEMBER_CODE_PATTERN = /^CC-[A-F0-9]{8}$/
export const CLUB_CRAFT_QR_PATTERN = /^clubcraft:(CC-[A-F0-9]{8})$/i

const DEFAULT_PUBLIC_SITE_URL = 'https://craft-cervezas.vercel.app'

export function normalizeClubMemberCode(value: string) {
  return value.trim().toUpperCase()
}

export function createClubCraftQrPayload(memberCode: string) {
  const normalized = normalizeClubMemberCode(memberCode)
  if (!CLUB_MEMBER_CODE_PATTERN.test(normalized)) {
    throw new Error('Código de miembro inválido.')
  }
  return `${CLUB_CRAFT_QR_PREFIX}${normalized}`
}

export function createClubCraftPublicMemberUrl(memberCode: string, origin?: string | null) {
  const normalized = normalizeClubMemberCode(memberCode)
  if (!CLUB_MEMBER_CODE_PATTERN.test(normalized)) {
    throw new Error('Código de miembro inválido.')
  }

  const baseUrl = (origin || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, '')
  return `${baseUrl}/club/${normalized}`
}

export function parseClubCraftQrPayload(payload: string) {
  const normalized = payload.trim()
  const payloadMatch = normalized.match(CLUB_CRAFT_QR_PATTERN)
  if (payloadMatch?.[1]) return payloadMatch[1].toUpperCase()

  const urlMatch = normalized.match(/\/club\/(CC-[A-F0-9]{8})(?:[/?#]|$)/i)
  if (urlMatch?.[1]) return urlMatch[1].toUpperCase()

  const code = normalizeClubMemberCode(normalized)
  if (CLUB_MEMBER_CODE_PATTERN.test(code)) return code
  return null
}

function renderQrSvg(payload: string, options: { size?: number; dark?: string; light?: string } = {}) {
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: 'M',
  })
  const quietZone = 4
  const moduleCount = qr.modules.size + quietZone * 2
  const size = options.size ?? 240
  const dark = options.dark ?? '#000'
  const light = options.light ?? '#fff'
  const rects: string[] = []

  qr.modules.data.forEach((darkModule, index) => {
    if (!darkModule) return
    const row = Math.floor(index / qr.modules.size)
    const col = index % qr.modules.size
    rects.push(`<rect x="${col + quietZone}" y="${row + quietZone}" width="1" height="1"/>`)
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${moduleCount} ${moduleCount}" role="img" aria-label="Club Craft QR" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/><g fill="${dark}">${rects.join('')}</g></svg>`
}

export function createClubCraftQrSvg(memberCode: string, options: { size?: number; dark?: string; light?: string } = {}) {
  const payload = createClubCraftQrPayload(memberCode)

  return {
    payload,
    svg: renderQrSvg(payload, options),
  }
}

export function createClubCraftPublicQrSvg(
  memberCode: string,
  options: { size?: number; dark?: string; light?: string; origin?: string | null } = {},
) {
  const payload = createClubCraftPublicMemberUrl(memberCode, options.origin)

  return {
    payload,
    svg: renderQrSvg(payload, options),
  }
}
