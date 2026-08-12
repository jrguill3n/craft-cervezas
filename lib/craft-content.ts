/**
 * Contenido provisional de Craft Cervezas.
 * Todo el texto vive aquí para poder reemplazarlo sin tocar componentes.
 */

export type Tap = {
  name: string
  style: string
  abv: string
  ibu?: string
  origin: string
}

export type MenuSection = {
  title: string
  items: { name: string; description?: string; price: string }[]
}

export type Branch = {
  index: string
  slug: string
  name: string
  neighborhood: string
  tagline: string
  description: string
  address: string
  mapsUrl: string
  mapEmbedQuery: string
  phone: string
  whatsapp: string
  hours: { days: string; time: string }[]
  image: string
  gallery?: { src: string; alt: string }[]
  taps: Tap[]
  menu: MenuSection[]
  promos: { day: string; title: string; detail: string }[]
}

export const branches: Branch[] = [
  {
    index: '03',
    slug: 'providencia',
    name: 'Providencia',
    neighborhood: 'Providencia, GDL',
    tagline: 'La barra larga',
    description:
      'La primera barra. Doce llaves rotativas, cocina abierta hasta el cierre y la mesa comunal donde empezó todo.',
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
    taps: [
      { name: 'Nube Baja', style: 'Hazy IPA', abv: '6.4%', ibu: '45', origin: 'Craft / GDL' },
      { name: 'Piedra Lisa', style: 'Pilsner checa', abv: '4.8%', ibu: '32', origin: 'Craft / GDL' },
      { name: 'Tinta', style: 'Stout de avena', abv: '5.9%', ibu: '38', origin: 'Craft / GDL' },
      { name: 'Solar', style: 'Pale ale', abv: '5.2%', ibu: '30', origin: 'Colima' },
      { name: 'Cuerda Floja', style: 'Sour de guayaba', abv: '4.2%', origin: 'Tlaquepaque' },
      { name: 'Barril 09', style: 'Barrel aged barleywine', abv: '9.8%', origin: 'Craft / GDL' },
    ],
    menu: [],
    promos: [
      { day: 'Martes', title: 'Dos por una', detail: 'Pintas de casa, 16:00 a 20:00' },
      { day: 'Jueves', title: 'Barril invitado', detail: 'Cervecería independiente distinta cada semana' },
    ],
  },
  {
    index: '01',
    slug: 'americana',
    name: 'Americana',
    neighborhood: 'Americana, GDL',
    tagline: 'La terraza',
    description:
      'Casona intervenida, patio abierto y la carta más experimental. Aquí probamos los lotes pequeños antes que nadie.',
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
    taps: [
      { name: 'Lote Corto', style: 'West coast IPA', abv: '6.8%', ibu: '62', origin: 'Craft / GDL' },
      { name: 'Patio', style: 'Saison de temporada', abv: '5.4%', ibu: '24', origin: 'Craft / GDL' },
      { name: 'Chapultepec', style: 'Lager de maíz criollo', abv: '4.5%', ibu: '18', origin: 'Craft / GDL' },
      { name: 'Ámbar 04', style: 'Vienna lager', abv: '5.1%', ibu: '26', origin: 'Zapopan' },
      { name: 'Jamaica Wild', style: 'Wild ale', abv: '6.1%', origin: 'Craft / GDL' },
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
    promos: [
      { day: 'Miércoles', title: 'Noche de lotes cortos', detail: 'Tres muestras de 200 ml por $120' },
      { day: 'Domingo', title: 'Vinilos en el patio', detail: 'Selectores invitados de 14:00 a 20:00' },
    ],
  },
  {
    index: '02',
    slug: 'chapalita',
    name: 'Chapalita',
    neighborhood: 'Chapalita, GDL',
    tagline: 'El barrio',
    description:
      'La barra de vecinos. Formato pequeño, servicio rápido y growlers para llevar la cerveza a casa.',
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
    taps: [
      { name: 'Vecina', style: 'Blonde ale', abv: '4.6%', ibu: '20', origin: 'Craft / GDL' },
      { name: 'Growler IPA', style: 'Session IPA', abv: '4.9%', ibu: '40', origin: 'Craft / GDL' },
      { name: 'Trigo 12', style: 'Hefeweizen', abv: '5.3%', ibu: '14', origin: 'Craft / GDL' },
      { name: 'Café Negro', style: 'Porter con café', abv: '6.2%', ibu: '35', origin: 'Craft / GDL' },
    ],
    menu: [],
    promos: [
      { day: 'Lunes', title: 'Growler feliz', detail: '20% en rellenos todo el día' },
      { day: 'Viernes', title: 'Cierre de semana', detail: 'Pinta + hot dog por $160' },
    ],
  },
].sort((a, b) => ['americana', 'chapalita', 'providencia'].indexOf(a.slug) - ['americana', 'chapalita', 'providencia'].indexOf(b.slug))

export const spotifyProfileUrl = 'https://open.spotify.com/user/kxg3ka40qtwukq3l5dpwya9n3?si=67ace30128bf4405&nd=1&dlsi=273c6c766c1f4381'

export const branchNav = branches.map((branch) => ({
  label: branch.name,
  href: `/${branch.slug}`,
}))

export const secondaryNav = [
  { label: 'Playlists', href: spotifyProfileUrl },
  { label: 'Contacto', href: '/#contacto' },
]

export const navigation = [...branchNav, ...secondaryNav]

/** Narrativa base tomada del manual de identidad. */
export const intro = {
  eyebrow: 'Defensores de lo craft',
  statement: 'Nos apasiona la cerveza y compartirla dio motivo a un movimiento.',
  body: 'Somos promotores del craft y nos resistimos a lo comercial sin calidad. Apostamos por las propuestas de productores independientes y ponemos a disposición de la comunidad una curaduría de cervezas de sabor.',
  pillars: [
    {
      marker: 'malta',
      title: 'Curaduría',
      detail:
        'Selección nacional e internacional de cervecerías independientes, revisada barril por barril.',
    },
    {
      marker: 'lupulo',
      title: 'Cultura cervecera',
      detail:
        'Información y contexto en la barra: de dónde viene cada cerveza y por qué vale la pena.',
    },
    {
      marker: 'hazy',
      title: 'Comunidad',
      detail:
        'Una invitación al descubrimiento, tanto para conocedores como para quien empieza.',
    },
  ],
} as const

export const clubBenefits = [
  {
    index: '01',
    title: '6 pintas + 1 gratis',
    detail: 'Cada seis pintas registradas, la séptima va por nuestra cuenta en cualquier sucursal.',
  },
  {
    index: '02',
    title: 'Puntos por consumo',
    detail: 'Acumulas puntos por cada consumo y los cambias por cerveza, comida o merch.',
  },
  {
    index: '03',
    title: 'Tarjeta digital',
    detail: 'Tu membresía vive en Apple Wallet y Google Wallet. Sin plásticos, sin apps extra.',
  },
]

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
