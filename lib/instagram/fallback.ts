import type { InstagramPost } from './types'

/**
 * Respaldo estático: último recurso cuando no hay feed en vivo ni caché.
 *
 * Solo contiene las URL reales de las publicaciones. No lleva imágenes porque
 * las portadas viven en la CDN de Instagram y solo se pueden resolver a través
 * de la fuente autenticada; inventar fotos locales daría una idea falsa del
 * contenido del perfil. La tarjeta se degrada a un bloque tipográfico que sigue
 * llevando al post original.
 */
const FALLBACK_PERMALINKS = [
  'https://www.instagram.com/p/DObuWqREp-1/',
  'https://www.instagram.com/p/DboJCN-ldTw/',
  'https://www.instagram.com/p/DbbzzyBRslS/',
  'https://www.instagram.com/p/DbbkVdTRhmM/',
  'https://www.instagram.com/p/DbWMmiwlXsB/',
] as const

/** Extrae el shortcode de una URL de publicación. */
export function shortcodeFromPermalink(permalink: string): string {
  return permalink.match(/\/(?:p|reel|tv)\/([^/?#]+)/)?.[1] ?? permalink
}

export const fallbackPosts: InstagramPost[] = FALLBACK_PERMALINKS.map((permalink) => ({
  id: shortcodeFromPermalink(permalink),
  permalink,
  image: null,
  aspect: 'square',
  caption: '',
  publishedAt: null,
  mediaType: 'image',
}))
