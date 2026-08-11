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
    index: '01',
    slug: 'providencia',
    name: 'Providencia',
    neighborhood: 'Providencia, GDL',
    tagline: 'La barra larga',
    description:
      'La primera barra. Doce llaves rotativas, cocina abierta hasta el cierre y la mesa comunal donde empezó todo.',
    address: 'Av. Pablo Neruda 2860, Providencia, 44630 Guadalajara, Jal.',
    mapsUrl: 'https://maps.google.com/?q=Av.+Pablo+Neruda+2860+Providencia+Guadalajara',
    mapEmbedQuery: 'Av. Pablo Neruda 2860, Providencia, Guadalajara',
    phone: '+52 33 1234 5601',
    whatsapp: '523312345601',
    hours: [
      { days: 'Lun — Mié', time: '16:00 — 00:00' },
      { days: 'Jue — Sáb', time: '13:00 — 02:00' },
      { days: 'Domingo', time: '13:00 — 22:00' },
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
    menu: [
      {
        title: 'Para compartir',
        items: [
          { name: 'Papas Craft', description: 'Alioli de chile morita', price: '$95' },
          { name: 'Alitas al tarro', description: 'Glaseadas con stout', price: '$165' },
          { name: 'Tabla de quesos', description: 'Tres quesos, nueces, pan', price: '$210' },
        ],
      },
      {
        title: 'Fuertes',
        items: [
          { name: 'Burger Craft', description: 'Doble carne, cheddar, cebolla en IPA', price: '$189' },
          { name: 'Costilla lenta', description: 'Seis horas, puré rústico', price: '$245' },
          { name: 'Coliflor rostizada', description: 'Opción vegetariana', price: '$155' },
        ],
      },
      {
        title: 'Otras bebidas',
        items: [
          { name: 'Michelada Craft', price: '$110' },
          { name: 'Café de olla', price: '$55' },
          { name: 'Limonada de hierbas', price: '$65' },
        ],
      },
    ],
    promos: [
      { day: 'Martes', title: 'Dos por una', detail: 'Pintas de casa, 16:00 a 20:00' },
      { day: 'Jueves', title: 'Barril invitado', detail: 'Cervecería independiente distinta cada semana' },
    ],
  },
  {
    index: '02',
    slug: 'americana',
    name: 'Americana',
    neighborhood: 'Americana, GDL',
    tagline: 'La terraza',
    description:
      'Casona intervenida, patio abierto y la carta más experimental. Aquí probamos los lotes pequeños antes que nadie.',
    address: 'Av. Chapultepec Sur 145, Americana, 44160 Guadalajara, Jal.',
    mapsUrl: 'https://maps.google.com/?q=Av.+Chapultepec+Sur+145+Americana+Guadalajara',
    mapEmbedQuery: 'Av. Chapultepec Sur 145, Americana, Guadalajara',
    phone: '+52 33 1234 5602',
    whatsapp: '523312345602',
    hours: [
      { days: 'Lun — Mié', time: '17:00 — 00:00' },
      { days: 'Jue — Sáb', time: '13:00 — 02:30' },
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
        title: 'Para compartir',
        items: [
          { name: 'Elote de la casa', description: 'Mayonesa de epazote', price: '$85' },
          { name: 'Tostadas de atún', price: '$175' },
          { name: 'Pretzel con queso', description: 'Fundido con lager', price: '$135' },
        ],
      },
      {
        title: 'Fuertes',
        items: [
          { name: 'Pizza de horno', description: 'Masa fermentada 48 h', price: '$205' },
          { name: 'Pollo al carbón', description: 'Media pieza, salsa macha', price: '$225' },
          { name: 'Tacos de hongos', price: '$150' },
        ],
      },
      {
        title: 'Otras bebidas',
        items: [
          { name: 'Vermut de la casa', price: '$120' },
          { name: 'Agua de temporada', price: '$50' },
          { name: 'Kombucha local', price: '$75' },
        ],
      },
    ],
    promos: [
      { day: 'Miércoles', title: 'Noche de lotes cortos', detail: 'Tres muestras de 200 ml por $120' },
      { day: 'Domingo', title: 'Vinilos en el patio', detail: 'Selectores invitados de 14:00 a 20:00' },
    ],
  },
  {
    index: '03',
    slug: 'chapalita',
    name: 'Chapalita',
    neighborhood: 'Chapalita, GDL',
    tagline: 'El barrio',
    description:
      'La barra de vecinos. Formato pequeño, servicio rápido y growlers para llevar la cerveza a casa.',
    address: 'Av. Guadalupe 1150, Chapalita, 45040 Zapopan, Jal.',
    mapsUrl: 'https://maps.google.com/?q=Av.+Guadalupe+1150+Chapalita+Zapopan',
    mapEmbedQuery: 'Av. Guadalupe 1150, Chapalita, Zapopan',
    phone: '+52 33 1234 5603',
    whatsapp: '523312345603',
    hours: [
      { days: 'Lun — Mié', time: '16:00 — 23:00' },
      { days: 'Jue — Sáb', time: '14:00 — 01:00' },
      { days: 'Domingo', time: '14:00 — 21:00' },
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
    menu: [
      {
        title: 'Para compartir',
        items: [
          { name: 'Cacahuates al comal', price: '$60' },
          { name: 'Dedos de queso', price: '$120' },
          { name: 'Nachos Craft', price: '$145' },
        ],
      },
      {
        title: 'Fuertes',
        items: [
          { name: 'Sándwich de pastrami', price: '$185' },
          { name: 'Hot dog de la casa', description: 'Tocino y cebolla caramelizada', price: '$115' },
          { name: 'Ensalada de la barra', price: '$135' },
        ],
      },
      {
        title: 'Para llevar',
        items: [
          { name: 'Growler 1 L', description: 'Cualquier llave de la barra', price: '$210' },
          { name: 'Growler 2 L', price: '$380' },
          { name: 'Six pack Craft', price: '$320' },
        ],
      },
    ],
    promos: [
      { day: 'Lunes', title: 'Growler feliz', detail: '20% en rellenos todo el día' },
      { day: 'Viernes', title: 'Cierre de semana', detail: 'Pinta + hot dog por $160' },
    ],
  },
]

export const branchNav = branches.map((branch) => ({
  label: branch.name,
  href: `/${branch.slug}`,
}))

export const secondaryNav = [
  { label: 'Club Craft', href: '/club-craft' },
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
  email: 'hola@craftcervezas.mx',
  press: 'prensa@craftcervezas.mx',
  city: 'Guadalajara, Jalisco · México',
  socials: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/craftcervezas',
      handle: '@craftcervezas',
    },
    { label: 'Facebook', href: 'https://facebook.com', handle: '/craftcervezas' },
    { label: 'WhatsApp', href: 'https://wa.me/523312345601', handle: '33 1234 5601' },
  ],
}

export function getBranch(slug: string) {
  return branches.find((branch) => branch.slug === slug)
}
