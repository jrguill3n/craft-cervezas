/**
 * Contenido provisional de Craft Cervezas.
 * Todo el texto vive aquí para poder reemplazarlo sin tocar componentes.
 */

export type MenuSection = {
  title: string
  items: { name: string; description?: string; price: string }[]
}

export type Branch = {
  index: string
  slug: string
  name: string
  neighborhood: string
  description: string
  address: string
  mapsUrl: string
  mapEmbedQuery: string
  phone: string
  whatsapp: string
  hours: { days: string; time: string }[]
  image: string
  gallery?: { src: string; alt: string }[]
  menu: MenuSection[]
}

export const branches: Branch[] = [
  {
    index: '03',
    slug: 'providencia',
    name: 'Providencia',
    neighborhood: 'Providencia, GDL',
    description:
      'Espacio acogedor pensado para pasar por unas cervezas para llevar o quedarte un rato a platicar.',
    address: 'Plaza Cantera, Av. Manuel Acuña 2995-B, Juan Manuel, 44680 Guadalajara, Jal.',
    mapsUrl: 'https://maps.app.goo.gl/w2uMvwmraLbCVLyt6?g_st=ic',
    mapEmbedQuery: 'CRAFT Providencia, Plaza Cantera, Av. Manuel Acuña 2995-B, Juan Manuel, 44680 Guadalajara, Jal.',
    phone: '+52 33 1234 5601',
    whatsapp: '523312345601',
    hours: [
      { days: 'Martes — Domingo', time: '14:00 — 22:00' },
    ],
    image: '/images/locations/providencia/hero.webp',
    gallery: [
      {
        src: '/images/locations/providencia/craft.webp',
        alt: 'Cliente disfrutando una cerveza frente al mural de Craft Providencia',
      },
      {
        src: '/images/locations/providencia/mesa.webp',
        alt: 'Mesa compartida con cervezas durante una degustación en Craft Providencia',
      },
      {
        src: '/images/locations/providencia/cerveza.webp',
        alt: 'Vaso de cerveza artesanal servido en Craft Providencia',
      },
      {
        src: '/images/locations/providencia/degustacion.webp',
        alt: 'Degustación de cerveza artesanal en la barra de Craft Providencia',
      },
    ],
    menu: [],
  },
  {
    index: '01',
    slug: 'americana',
    name: 'Americana',
    neighborhood: 'Americana, GDL',
    description:
      '15 llaves de cerveza de barril y 200 opciones de etiqueta para degustar en un espacio amplio y abierto.',
    address: 'Av. de la Paz 1766, Local 2, Col. Americana, 44160 Guadalajara, Jal.',
    mapsUrl: 'https://maps.app.goo.gl/B7rdZxEviALVKT8D8?g_st=ic',
    mapEmbedQuery: 'CRAFT Americana, Av. de la Paz 1766, Local 2, Col. Americana, 44160 Guadalajara, Jal.',
    phone: '+52 33 1234 5602',
    whatsapp: '523312345602',
    hours: [
      { days: 'Lunes — Sábado', time: '16:00 — 00:00' },
      { days: 'Domingo', time: '13:00 — 21:00' },
    ],
    image: '/images/locations/americana/hero.webp',
    gallery: [
      {
        src: '/images/locations/americana/cervezas.webp',
        alt: 'Amigos brindando con cerveza artesanal en la terraza de Craft Americana',
      },
      {
        src: '/images/locations/americana/ambiente.webp',
        alt: 'Clientes conversando en el interior de Craft Americana',
      },
      {
        src: '/images/locations/americana/servicio.webp',
        alt: 'Cerveza artesanal sirviéndose en Craft Americana',
      },
      {
        src: '/images/locations/americana/barra.webp',
        alt: 'Cerveza recién servida desde las llaves de Craft Americana',
      },
    ],
    menu: [
      {
        title: 'Burgers',
        items: [
          {
            name: 'Craft Burger',
            description: 'Carne molida de res con queso americano, tomate bola, corazón de lechuga, cebolla blanca y aderezo de la casa.',
            price: '$145 · Doble $195',
          },
          {
            name: 'Bacon Blue Cheese Burger',
            description: 'Carne molida de res con queso americano, cebolla caramelizada, tocino y aderezo de queso azul.',
            price: '$145 · Doble $195',
          },
        ],
      },
      {
        title: 'Sandwiches',
        items: [
          {
            name: 'BLT Sandwich',
            description: 'Pan de caja estilo italiano con tocino corte grueso, tomate bola, corazón de lechuga, cebolla blanca y queso americano, acompañado de papas lemon.',
            price: '$120',
          },
          {
            name: 'Grilled Cheese Sandwich',
            description: 'Pan de caja estilo italiano con queso Monterrey, cheddar y americano, acompañado de sopa de tomate.',
            price: '$145',
          },
          {
            name: 'Chicken Chaangüich',
            description: 'Pan de caja estilo italiano con pollo frito, ensalada de col, queso Monterrey y mayonesa de la casa, acompañado de yam fries.',
            price: '$175',
          },
          {
            name: 'Pulled Pork Sandwich',
            description: 'Pan de masa madre con cabeza de lomo ahumado por 18 hrs y ensalada de col casera.',
            price: '$195',
          },
          {
            name: 'Chili Dog',
            description: 'Hot dog de res en pan brioche con queso cheddar gratinado, cebolla caramelizada, chili de carne molida y chile toreado.',
            price: '$145',
          },
        ],
      },
      {
        title: 'Fries',
        items: [
          {
            name: 'Papas Fritas',
            description: 'Papas caseras con lemon pepper acompañadas de salsa pikina.',
            price: '$65',
          },
          {
            name: 'Papas con Ponzoña',
            description: 'Papas caseras con chicharrón de chile serrano.',
            price: '$75',
          },
          {
            name: 'Fries',
            description: 'Papas a la francesa acompañadas de salsa cátsup.',
            price: '$75',
          },
          {
            name: 'Buffalo Fries',
            description: 'Papas a la francesa bañadas de salsa buffalo, aderezo de queso azul y queso azul.',
            price: '$120',
          },
          {
            name: 'Fried Chicken Fries',
            description: 'Papas a la francesa con pollo frito, acompañadas de salsa buffalo y aderezo de queso azul.',
            price: '$145',
          },
          {
            name: 'Chili Cheese Fries',
            description: 'Papas a la francesa gratinadas con queso amarillo y cubiertas con chili de carne molida.',
            price: '$175',
          },
          {
            name: 'Papas Mr. Green',
            description: 'Papas cambray aplastadas y fritas, con salsa de limón y chile serrano con un toque de cilantro.',
            price: '$100',
          },
          {
            name: 'Yam Fries & Fried Chicken',
            description: 'Papas de camote con pollo frito sazonado en especias acompañado de mayonesa de la casa y un toque de perejil.',
            price: '$145',
          },
        ],
      },
      {
        title: 'Snacks & Nachos',
        items: [
          {
            name: 'Aceitunas',
            description: 'Aceituna verde maceradas en aceite de olivo, ajo y semillas de mostaza.',
            price: '$90',
          },
          {
            name: 'Carne Seca',
            description: 'Carne seca acompañada de limón y salsa pikina.',
            price: '$120',
          },
          {
            name: 'Corn Ribs',
            description: 'Costillas de elote fritas con paprika, sal con ajo y aderezo de queso azul.',
            price: '$120',
          },
          {
            name: 'Nachos Naturales',
            description: 'Chips de maíz con quesos, pico de gallo y crema especiada.',
            price: '$150',
          },
          {
            name: 'Nachos Pulled Pork',
            description: 'Chips de maíz con quesos, pico de gallo, crema especiada y pulled pork ahumado por 18 horas.',
            price: '$250',
          },
          {
            name: 'Nachos con Chili',
            description: 'Chips de maíz con quesos, pico de gallo, crema especiada y chili casero.',
            price: '$195',
          },
        ],
      },
    ],
  },
  {
    index: '02',
    slug: 'chapalita',
    name: 'Chapalita',
    neighborhood: 'Chapalita, GDL',
    description:
      '10 llaves de cerveza de barril y 200 opciones de etiquetas en un espacio acogedor y con buena vibra.',
    address: 'Av. Tepeyac 497, Local 4, Chapalita, 45040 Guadalajara, Jal.',
    mapsUrl: 'https://maps.app.goo.gl/dMcAEpsZSzTAp5SZ9?g_st=ic',
    mapEmbedQuery: 'CRAFT Chapalita, Av. Tepeyac 497, Local 4, Chapalita, 45040 Guadalajara, Jal.',
    phone: '+52 33 1234 5603',
    whatsapp: '523312345603',
    hours: [
      { days: 'Martes — Sábado', time: '16:00 — 00:00' },
      { days: 'Domingo', time: '16:00 — 22:00' },
    ],
    image: '/images/locations/chapalita/hero.webp',
    gallery: [
      {
        src: '/images/locations/chapalita/fachada.webp',
        alt: 'Fachada y letrero de Craft Chapalita al atardecer',
      },
      {
        src: '/images/locations/chapalita/barra.webp',
        alt: 'Equipo de Craft atendiendo la barra de Chapalita',
      },
      {
        src: '/images/locations/chapalita/cerveza.webp',
        alt: 'Cerveza de barril sirviéndose en un vaso de Craft',
      },
      {
        src: '/images/locations/chapalita/mesa.webp',
        alt: 'Cervezas y comida compartidas en una mesa de Craft Chapalita',
      },
    ],
    menu: [],
  },
].sort((a, b) => ['americana', 'chapalita', 'providencia'].indexOf(a.slug) - ['americana', 'chapalita', 'providencia'].indexOf(b.slug))

export const spotifyProfileUrl = 'https://open.spotify.com/user/kxg3ka40qtwukq3l5dpwya9n3?si=67ace30128bf4405&nd=1&dlsi=273c6c766c1f4381'

export const branchNav = branches.map((branch) => ({
  label: branch.name,
  href: `/${branch.slug}`,
}))

export const contact = {
  email: 'hola@craftcervezas.com',
  city: 'Guadalajara, Jalisco · México',
  socials: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/craftcervezas',
      handle: '@craftcervezas',
    },
    {
      label: 'Spotify',
      href: spotifyProfileUrl,
      handle: 'Playlists de Craft',
    },
    { label: 'Facebook', href: 'https://facebook.com/craftcervezas', handle: '/craftcervezas' },
  ],
}

export function getBranch(slug: string) {
  return branches.find((branch) => branch.slug === slug)
}
