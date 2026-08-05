import 'server-only'

import { fallbackPosts, shortcodeFromPermalink } from './fallback'
import { INSTAGRAM_POST_LIMIT, type InstagramFeed, type InstagramPost } from './types'

/** Seis horas. Instagram no se consulta en cada visita. */
const REVALIDATE_SECONDS = 6 * 60 * 60

/**
 * Última respuesta buena en memoria del proceso. Permite seguir mostrando el
 * feed anterior si una revalidación falla. Se pierde en un arranque en frío,
 * y en ese caso se cae al respaldo estático.
 */
let lastGoodPosts: InstagramPost[] | null = null

type GraphMedia = {
  id?: string
  caption?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_product_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
}

/** Recorta el pie a una sola línea legible. */
function normalizeCaption(caption: string | undefined): string {
  if (!caption) return ''
  const firstLine = caption.split('\n')[0].replace(/\s+/g, ' ').trim()
  if (firstLine.length <= 90) return firstLine
  return `${firstLine.slice(0, 89).trimEnd()}…`
}

function normalizeMedia(media: GraphMedia): InstagramPost | null {
  const permalink = media.permalink
  if (!permalink) return null

  const isReel = media.media_product_type === 'REELS'
  const mediaType: InstagramPost['mediaType'] = isReel
    ? 'reel'
    : media.media_type === 'CAROUSEL_ALBUM'
      ? 'carousel'
      : media.media_type === 'VIDEO'
        ? 'video'
        : 'image'

  // En video y Reel la portada llega en thumbnail_url; media_url es el archivo.
  const image =
    media.media_type === 'VIDEO' ? (media.thumbnail_url ?? null) : (media.media_url ?? null)

  return {
    id: media.id ?? shortcodeFromPermalink(permalink),
    permalink,
    image,
    // La Graph API no expone dimensiones: los Reels son verticales y el resto
    // se muestra en el encuadre cuadrado de la retícula del perfil.
    aspect: isReel ? 'portrait' : 'square',
    caption: normalizeCaption(media.caption),
    publishedAt: media.timestamp ?? null,
    mediaType,
  }
}

/**
 * Consulta la Graph API de Instagram. Requiere un token de acceso de larga
 * duración de una cuenta de empresa o creador (INSTAGRAM_ACCESS_TOKEN).
 *
 * Los endpoints públicos del perfil ya no son viables: el HTML del perfil, el
 * `embed` de cada post y el antiguo oEmbed responden con muro de inicio de
 * sesión, así que la única fuente estable es la API autenticada.
 */
async function fetchFromGraphApi(accessToken: string): Promise<InstagramPost[]> {
  const endpoint = new URL('https://graph.instagram.com/v21.0/me/media')
  endpoint.searchParams.set(
    'fields',
    'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp',
  )
  endpoint.searchParams.set('limit', String(INSTAGRAM_POST_LIMIT))
  endpoint.searchParams.set('access_token', accessToken)

  const response = await fetch(endpoint, {
    // La respuesta se guarda 6 h y se revalida automáticamente al expirar.
    next: { revalidate: REVALIDATE_SECONDS, tags: ['instagram-feed'] },
  })

  if (!response.ok) {
    throw new Error(`Graph API respondió ${response.status}`)
  }

  const payload = (await response.json()) as { data?: GraphMedia[] }
  const posts = (payload.data ?? [])
    .map(normalizeMedia)
    .filter((post): post is InstagramPost => post !== null)

  if (posts.length === 0) {
    throw new Error('Graph API no devolvió publicaciones')
  }

  return posts
}

/**
 * Devuelve las publicaciones más recientes, de la más nueva a la más antigua.
 * Nunca lanza: si la obtención falla, degrada al último feed conocido y, si no
 * hay ninguno, al respaldo estático.
 */
export async function getInstagramFeed(): Promise<InstagramFeed> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!accessToken) {
    return { posts: fallbackPosts, source: 'fallback' }
  }

  try {
    const posts = await fetchFromGraphApi(accessToken)
    const ordered = [...posts]
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, INSTAGRAM_POST_LIMIT)

    lastGoodPosts = ordered
    return { posts: ordered, source: 'live' }
  } catch (error) {
    // Se registra en el servidor; la visitante nunca ve el detalle técnico.
    console.error(
      '[instagram] No se pudo obtener el feed:',
      error instanceof Error ? error.message : error,
    )

    if (lastGoodPosts) {
      return { posts: lastGoodPosts, source: 'cache' }
    }

    return { posts: fallbackPosts, source: 'fallback' }
  }
}
