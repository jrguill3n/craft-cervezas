import type { Metadata } from 'next'
import { getPublishedTapList } from '@/lib/tap-list'
import type { TapListFull } from '@/lib/db-types'

export const metadata: Metadata = {
  title: {
    absolute: 'Insurgente GDL | Tap List & Soul Burger Lab',
  },
  description: 'Tap List actual de Insurgente GDL y menú de Soul Burger Lab.',
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
    <section className="px-5 pb-12 md:px-10 md:pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-5 border-b border-white/20 pb-4">
          <div>
            <h2 className="text-4xl font-black leading-none tracking-tight md:text-6xl">TAP LIST</h2>
          </div>
          {tapList?.tap_list_items?.length ? (
            <p className="pb-1 font-mono text-xs uppercase tracking-[0.18em] text-white/45">
              {tapList.tap_list_items.length} taps
            </p>
          ) : null}
        </div>

        {loadFailed ? (
          <div className="py-14">
            <p className="text-xl font-semibold">No pudimos cargar el Tap List.</p>
            <p className="mt-2 text-sm text-white/55">Intenta de nuevo en unos minutos o consulta con el bar.</p>
          </div>
        ) : tapList?.tap_list_items?.length ? (
          <ol className="divide-y divide-white/12">
            {tapList.tap_list_items.map((item, index) => {
              const option = item.serving_options
                .slice()
                .sort((a, b) => a.display_order - b.display_order)[0]
              return (
                <li key={item.id} className="grid gap-4 py-5 md:grid-cols-[4rem_minmax(0,1.35fr)_minmax(0,1fr)_auto] md:items-baseline md:gap-8">
                  <p className="font-mono text-sm text-[#e13b2f]">
                    {String(item.tap_number ?? index + 1).padStart(2, '0')}
                  </p>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black uppercase leading-none tracking-tight md:text-3xl">
                      {item.beers.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/55">{item.beers.brewery}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">{item.beers.style}</p>
                  <div className="flex items-baseline justify-between gap-5 md:min-w-52 md:justify-end">
                    <p className="font-mono text-sm text-white/65">{item.beers.abv}%</p>
                    <p className="text-right text-sm">
                      {option ? (
                        <>
                          <span className="text-white/45">{option.label || option.size}</span>
                          <span className="ml-2 font-mono font-bold text-white">{formatPrice(option.price)}</span>
                        </>
                      ) : (
                        <span className="text-white/35">—</span>
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="py-14">
            <p className="text-xl font-semibold">Tap List en actualización. Consulta con el bar.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function SoulBurgerSection() {
  return (
    <section className="border-t border-white/15 bg-[#080808] px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#e13b2f]">NOT JUST A BURGER</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-tight md:text-6xl">
              SOUL BURGER LAB
            </h2>
          </div>
          <div className="flex justify-start sm:justify-end">
            <img
              src={SOUL_BURGER_LOGO}
              alt="Soul Fried Chicken"
              className="max-h-20 max-w-56 border border-white/10 object-contain opacity-95"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {soulBurgerMenu.map((section) => (
            <section key={section.title}>
              <h3 className="border-b border-[#e13b2f]/70 pb-3 text-sm font-black uppercase tracking-[0.22em] text-[#e13b2f]">
                {section.title}
              </h3>
              <div className="divide-y divide-white/10">
                {section.items.map((item) => (
                  <article key={item.name} className="py-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="text-lg font-black uppercase leading-tight">{item.name}</h4>
                      {item.price ? <p className="font-mono text-base font-bold">{item.price}</p> : null}
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-white/62">{item.description}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 space-y-3 border-t border-white/15 pt-6">
          <p className="text-sm text-white/55">
            Todas las burgers y sandos incluyen una porción de 25 gr de chips.
          </p>
          <p className="text-xs font-black tracking-[0.28em] text-[#e13b2f]">DINE IN ONLY</p>
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
    <main className="min-h-dvh bg-[#030303] text-white">
      <header className="px-5 pt-8 pb-7 md:px-10 md:pt-12 md:pb-9">
        <div className="mx-auto max-w-4xl">
          <img
            src={INSURGENTE_LOGO}
            alt="Insurgente GDL"
            className="h-auto w-64 max-w-full invert md:w-80"
          />
          <p className="mt-4 text-xs font-black tracking-[0.36em] text-white/45">GDL</p>
        </div>
      </header>

      <TapListSection tapList={tapList} loadFailed={loadFailed} />
      <SoulBurgerSection />

      <footer className="border-t border-white/15 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 text-xs text-white/45 sm:flex-row sm:items-end sm:justify-between">
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
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center font-semibold tracking-[0.18em] transition-colors hover:text-white"
          >
            INSTAGRAM
          </a>
          <img
            src={INSURGENTE_OWL}
            alt=""
            aria-hidden="true"
            className="h-16 w-auto invert opacity-45"
          />
        </div>
      </footer>
    </main>
  )
}
