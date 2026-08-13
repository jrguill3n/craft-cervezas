import type { Metadata } from 'next'
import { getPublishedTapList } from '@/lib/tap-list'
import type { TapListFull } from '@/lib/db-types'
import { siteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: {
    absolute: 'Insurgente GDL | Tap List & Soul Burger Lab',
  },
  description: 'Tap List actual de Insurgente GDL y menú de Soul Burger Lab.',
  alternates: {
    canonical: '/taplist-insurgente-gdl',
  },
  openGraph: {
    title: 'Insurgente GDL | Tap List & Soul Burger Lab',
    description: 'Tap List actual de Insurgente GDL y menú de Soul Burger Lab.',
    url: `${siteUrl}/taplist-insurgente-gdl`,
    siteName: 'Insurgente GDL',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: '/brand/insurgente/insurgente-owl.png',
        alt: 'Insurgente GDL',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insurgente GDL | Tap List & Soul Burger Lab',
    description: 'Tap List actual de Insurgente GDL y menú de Soul Burger Lab.',
    images: ['/brand/insurgente/insurgente-owl.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const dynamic = 'force-dynamic'

const INSTAGRAM_URL = 'https://www.instagram.com/insurgentebrew_gdl/'
const INSURGENTE_LOGO = '/brand/insurgente/insurgente-logo.svg'
const INSURGENTE_OWL = '/brand/insurgente/insurgente-owl.png'
const SOUL_BURGER_LOGO = '/brand/insurgente/soul-fried-chicken-logo.png'

type MenuItem = {
  name: string
  description?: string
  price?: string
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const soulBurgerMenu: MenuSection[] = [
  {
    title: 'BURGERS',
    items: [
      {
        name: 'THE BIG ASS BURGER',
        price: '250',
        description: '220 gr Black Angus, brioche, spicy mayo, doble tocino, americano + muenster.',
      },
      {
        name: 'TRUFFLE BURGER',
        price: '300',
        description: '220 gr Black Angus, Monterey Jack, tocino, mayo trufada, aceite de trufa.',
      },
      {
        name: 'BUFFALO BURGER',
        price: '250',
        description: '220 gr Black Angus, Monterey Jack, buffalo, blue cheese, sauerkraut.',
      },
      {
        name: 'THE SOUL BURGER',
        price: '250',
        description: '220 gr Black Angus, Monterey Jack, alioli ajo negro + ponzu, tocino.',
      },
      {
        name: 'MAPLE MONEY',
        price: '255',
        description: '220 gr Black Angus, Queso americano, Noisette butter Maple y tocino.',
      },
    ],
  },
  {
    title: 'SANDOS',
    items: [
      {
        name: 'SANDO BUFFALO',
        price: '195',
        description: '175 gr de Pechuga crujiente, Monterey Jack, buffalo, blue cheese, sauerkraut.',
      },
      {
        name: 'BRISKET SANDO',
        price: '320',
        description: '200 gr de Brisket ahumado, queso americano, BBQ, aros de cebolla.',
      },
    ],
  },
  {
    title: 'FRIED CHICKEN',
    items: [
      {
        name: 'BONELESS',
        price: '205',
        description: '175 gr de Pierna muslo deshuesado fritos, 2 salsas.',
      },
      {
        name: 'TENDERS',
        price: '195',
        description: '4 pzas pechuga crujiente, chips + 2 salsas.',
      },
    ],
  },
  {
    title: 'SIDES',
    items: [
      {
        name: 'JUST FRIES (200 gr)',
        price: '80',
      },
      {
        name: 'TRUFFLE FRIES',
        price: '135',
        description: 'Tartufata, grana padano, aceite de trufa y cebollín.',
      },
      {
        name: 'SOUL CHIPS',
        price: '80',
        description: 'Alioli, grana padano, pimentón.',
      },
      {
        name: 'IBÉRICO CHIPS',
        price: '145',
        description: 'Alioli, idiazábal, jamón ibérico.',
      },
    ],
  },
  {
    title: 'DESSERTS',
    items: [
      {
        name: 'TARTA DE CHOCOLATE',
        price: '130',
        description: 'Tarta de chocolate, cremoso de vainilla, coulis.',
      },
      {
        name: 'NOT FRIED CHICKEN',
        price: '95',
        description: '????????',
      },
    ],
  },
  {
    title: 'SAUCES',
    items: [
      {
        name: 'BUFFALO - BLUE CHEESE - ALIOLI - HONEY MUSTARD - ALIOLI AJO NEGRO - BBQ - K BBQ - SPICY MAYO',
      },
    ],
  },
]

function formatPrice(value: number) {
  return `$${Number(value).toFixed(0)}`
}

function TapListSection({
  tapList,
  loadFailed,
}: {
  tapList: TapListFull | null
  loadFailed: boolean
}) {
  return (
    <section className="px-4 pb-10 md:px-10 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-end justify-between gap-5">
          <div>
            <p className="font-serif text-sm italic text-black/60">Sé un Insurgente, toma artesanal</p>
            <h2 className="mt-2 text-4xl font-black leading-none tracking-[0.06em] md:text-6xl">TAP LIST</h2>
          </div>
          {tapList?.tap_list_items?.length ? (
            <p className="pb-1 font-mono text-xs uppercase tracking-[0.18em] text-black/45">
              {tapList.tap_list_items.length} taps
            </p>
          ) : null}
        </div>

        <div className="border-y-4 border-black bg-[#f8f7f2] shadow-[0_12px_0_#111]">
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem_4.5rem] border-b-2 border-black px-3 py-2 font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-black/55 md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(8rem,0.8fr)_4rem_6rem] md:px-5">
            <span>No.</span>
            <span>Cerveza</span>
            <span className="hidden md:block">Estilo</span>
            <span>Alc %</span>
            <span className="text-right">Pinta</span>
          </div>

          {loadFailed ? (
            <div className="px-4 py-12 md:px-6">
            <p className="text-xl font-semibold">No pudimos cargar el Tap List.</p>
            <p className="mt-2 text-sm text-black/55">Intenta de nuevo en unos minutos o consulta con el bar.</p>
          </div>
        ) : tapList?.tap_list_items?.length ? (
          <ol>
            {tapList.tap_list_items.map((item, index) => {
              const option = item.serving_options
                .slice()
                .sort((a, b) => a.display_order - b.display_order)[0]
              return (
                <li key={item.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem_4.5rem] items-baseline border-b border-black/70 px-3 py-3 last:border-b-0 md:grid-cols-[4rem_minmax(0,1.2fr)_minmax(8rem,0.8fr)_4rem_6rem] md:px-5">
                  <p className="font-mono text-sm font-bold text-black/70">
                    {String(item.tap_number ?? index + 1).padStart(2, '0')}
                  </p>
                  <div className="min-w-0">
                    <h3 className="font-mono text-lg font-black uppercase leading-none tracking-[0.02em] md:text-2xl">
                      {item.beers.name}
                    </h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wide text-black/55">{item.beers.brewery}</p>
                    <p className="mt-2 text-xs leading-tight text-black/65 md:hidden">{item.beers.style}</p>
                  </div>
                  <p className="hidden font-mono text-sm uppercase leading-tight text-black/70 md:block">{item.beers.style}</p>
                  <p className="font-mono text-sm font-bold text-black/75">{item.beers.abv}</p>
                  <p className="text-right font-mono text-sm font-black text-black">
                    {option ? formatPrice(option.price) : '—'}
                  </p>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="px-4 py-12 md:px-6">
            <p className="text-xl font-semibold">Tap List en actualización. Consulta con el bar.</p>
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

function SoulBurgerSection() {
  return (
    <section className="border-t-2 border-black bg-[#f3f1ec] px-5 py-12 text-black md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="font-serif text-sm italic text-black/60">NOT JUST A BURGER</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[0.04em] md:text-6xl">
              SOUL BURGER LAB
            </h2>
          </div>
          <div className="flex justify-start sm:justify-end">
            <img
              src={SOUL_BURGER_LOGO}
              alt="Soul Fried Chicken"
              className="max-h-20 max-w-56 border border-black/10 object-contain opacity-95"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {soulBurgerMenu.map((section) => (
            <section key={section.title}>
              <h3 className="border-b-2 border-black pb-3 text-sm font-black uppercase tracking-[0.22em] text-black">
                {section.title}
              </h3>
              <div className="divide-y divide-black/20">
                {section.items.map((item) => (
                  <article key={item.name} className="py-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="text-lg font-black uppercase leading-tight">{item.name}</h4>
                      {item.price ? <p className="font-mono text-base font-bold">{item.price}</p> : null}
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-black/62">{item.description}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 space-y-3 border-t-2 border-black pt-6 text-center">
          <p className="text-sm text-black/65">
            Todas las burgers y sandos incluyen una porción de 25 gr de chips.
          </p>
          <p className="text-3xl font-black tracking-[0.04em] text-black md:text-5xl">DINE IN ONLY</p>
        </div>
      </div>
    </section>
  )
}

export default async function InsurgenteGdlPage() {
  let tapList: TapListFull | null = null
  let loadFailed = false

  try {
    tapList = await getPublishedTapList('insurgente-gdl')
  } catch (error) {
    loadFailed = true
    console.error('[insurgente-gdl] Could not load published tap list:', error)
  }

  return (
    <main className="min-h-dvh bg-[#f3f1ec] text-black">
      <header className="px-5 pt-8 pb-5 text-center md:px-10 md:pt-12 md:pb-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <img
            src={INSURGENTE_LOGO}
            alt="Insurgente GDL"
            className="h-auto w-64 max-w-full md:w-80"
          />
          <div className="mt-4 h-1 w-64 max-w-full bg-black md:w-80" />
          <p className="mt-4 max-w-xs font-serif text-sm italic leading-snug text-black/55 md:max-w-none">
            Argentina 16, Col. Americana. Guadalajara.
          </p>
        </div>
      </header>

      <TapListSection tapList={tapList} loadFailed={loadFailed} />
      <SoulBurgerSection />

      <footer className="bg-black px-5 py-5 text-[#f3f1ec] md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 text-xs text-white/60">
          <div>
            <p className="font-black tracking-[0.24em] text-white">INSURGENTE GDL</p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-semibold tracking-[0.16em] transition-colors hover:text-white"
            >
              @insurgentebrew_gdl
            </a>
          </div>
          <img
            src={INSURGENTE_OWL}
            alt=""
            aria-hidden="true"
            className="h-20 w-14 shrink-0 object-contain invert opacity-80 sm:w-auto"
          />
        </div>
        <div className="mt-4 overflow-hidden border-t border-white/25 pt-3 font-serif text-xs italic tracking-wide text-white/55">
          <p className="whitespace-nowrap">
            ¡Sé un Insurgente, toma artesanal! &nbsp; ¡Sé un Insurgente, toma artesanal! &nbsp; ¡Sé un Insurgente, toma artesanal!
          </p>
        </div>
      </footer>
    </main>
  )
}
