/** Publicación normalizada, independiente de la fuente que la haya provisto. */
export type InstagramPost = {
  /** Identificador estable (shortcode de la publicación). */
  id: string
  /** URL de la publicación original en Instagram. */
  permalink: string
  /** Portada: imagen del post, o frame de portada en video/Reel. Null si no hay. */
  image: string | null
  /** Proporción de la portada, usada para no recortar la imagen. */
  aspect: 'square' | 'portrait' | 'landscape'
  /** Pie recortado a una línea. Cadena vacía si la publicación no tiene texto. */
  caption: string
  /** Fecha de publicación en ISO 8601. Null si la fuente no la expone. */
  publishedAt: string | null
  /** Tipo de medio normalizado. */
  mediaType: 'image' | 'carousel' | 'reel' | 'video'
}

/** Origen del que provienen las publicaciones que se están mostrando. */
export type InstagramFeedSource = 'live' | 'cache' | 'fallback'

export type InstagramFeed = {
  posts: InstagramPost[]
  source: InstagramFeedSource
}

export const instagramProfile = {
  handle: '@craftcervezas',
  url: 'https://www.instagram.com/craftcervezas',
} as const

/** Número de publicaciones que muestra la sección. */
export const INSTAGRAM_POST_LIMIT = 8
