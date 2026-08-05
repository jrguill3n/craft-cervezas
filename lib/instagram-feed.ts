/**
 * Feed de Instagram — datos desacoplados de la vista.
 *
 * Hoy son marcadores estáticos. Para conectar el feed oficial más adelante,
 * basta con sustituir `instagramPosts` por el resultado de la fuente aprobada
 * (Instagram Graph API u otro proveedor autorizado) manteniendo el tipo
 * `InstagramPost`. El componente no necesita cambios.
 *
 * Al reemplazar cada publicación:
 *  - `permalink` debe apuntar a la URL real del post (https://www.instagram.com/p/...).
 *    Mientras sean marcadores, todos apuntan al perfil para no generar enlaces roto.
 *  - `aspect` debe coincidir con la proporción original de la imagen para no recortarla.
 */

export type InstagramPost = {
  id: string
  /** Ruta local o URL remota de la imagen. */
  image: string
  /** Proporción original de la publicación. */
  aspect: 'square' | 'portrait'
  /** Texto alternativo descriptivo para lectores de pantalla. */
  alt: string
  /** Pie corto que se muestra bajo la imagen. */
  caption: string
  /** URL de la publicación en Instagram. */
  permalink: string
}

export const instagramProfile = {
  handle: '@craftcervezas',
  url: 'https://www.instagram.com/craftcervezas',
}

export const instagramPosts: InstagramPost[] = [
  {
    id: 'post-01',
    image: '/instagram/post-01.jpg',
    aspect: 'square',
    alt: 'Tarja sirviendo una pinta de cerveza clara detrás de la barra',
    caption: 'Llaves abiertas en Providencia',
    permalink: instagramProfile.url,
  },
  {
    id: 'post-02',
    image: '/instagram/post-02.jpg',
    aspect: 'portrait',
    alt: 'Pinta de stout con espuma cremosa sobre una mesa de madera oscura',
    caption: 'Tinta, nuestra stout de avena',
    permalink: instagramProfile.url,
  },
  {
    id: 'post-03',
    image: '/instagram/post-03.jpg',
    aspect: 'square',
    alt: 'Patio exterior con luces colgantes y mesas ocupadas al atardecer',
    caption: 'Tardes de patio en Americana',
    permalink: instagramProfile.url,
  },
  {
    id: 'post-04',
    image: '/instagram/post-04.jpg',
    aspect: 'portrait',
    alt: 'Cuatro copas de cata con cervezas de distintos tonos sobre una tabla',
    caption: 'Cata de lotes cortos',
    permalink: instagramProfile.url,
  },
  {
    id: 'post-05',
    image: '/instagram/post-05.jpg',
    aspect: 'square',
    alt: 'Hamburguesa con queso fundido junto a un vaso de cerveza ámbar',
    caption: 'Burger Craft recién salida',
    permalink: instagramProfile.url,
  },
  {
    id: 'post-06',
    image: '/instagram/post-06.jpg',
    aspect: 'portrait',
    alt: 'Growler de vidrio ámbar llenándose directamente de la llave',
    caption: 'Growlers para llevar en Chapalita',
    permalink: instagramProfile.url,
  },
]
