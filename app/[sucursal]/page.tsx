import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle, Phone } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ShareTapListButton } from '@/components/share-tap-list-button'
import { branches, getBranch } from '@/lib/craft-content'
import { getPublishedTapList } from '@/lib/tap-list'

// Dynamic render so the Supabase tap list is always fresh
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sucursal: string }>
}): Promise<Metadata> {
  const { sucursal } = await params
  const branch = getBranch(sucursal)
  if (!branch) return {}
  return { // branch is defined here
    title: branch.name,
    description: branch.description,
  }
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ sucursal: string }>
}) {
  const { sucursal } = await params
  const maybeBranch = getBranch(sucursal)
  if (!maybeBranch) notFound()
  const branch = maybeBranch!

  let tapList = null
  let tapListError = false
  try {
    tapList = await getPublishedTapList(sucursal)
  } catch (error) {
    tapListError = true
    console.error(`[branch-page] Tap list failed for ${sucursal}:`, error)
  }
  const others = branches.filter((item) => item.slug !== branch.slug)

  return (
    <>
      <SiteHeader />
      <main>
        {/* Encabezado editorial */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10">
            <div className="label-xs flex items-center gap-4 text-muted-foreground">
              <span className="text-accent">{branch.index}</span>
              <span className="h-px flex-1 bg-foreground/25" aria-hidden="true" />
              <span>{branch.neighborhood}</span>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-12">
              <h1 className="display-tight text-[clamp(3.5rem,10vw,8rem)] md:col-span-7">
                {branch.name}
              </h1>
              <div className="md:col-span-4 md:col-start-9">
                <p className="label-xs text-muted-foreground">{branch.tagline}</p>
                <p className="mt-4 text-base leading-relaxed text-foreground/80">
                  {branch.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${branch.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="label-xs inline-flex items-center gap-2 bg-accent px-5 py-3 font-semibold text-accent-foreground"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, '')}`}
                    className="label-xs inline-flex items-center gap-2 border border-foreground/30 px-5 py-3 font-semibold"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {branch.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-16/9 border-t border-foreground/20 md:aspect-21/9">
            <Image
              src={branch.image}
              alt={`Interior de Craft ${branch.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        {branch.gallery?.length ? (
          <section aria-labelledby="galeria-sucursal" className="border-b border-foreground/20">
            <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
              <div className="grid items-end gap-5 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-4">
                  <p className="label-xs text-accent">La experiencia</p>
                  <h2 id="galeria-sucursal" className="display-tight mt-4 text-4xl md:text-6xl">
                    Así se vive {branch.name}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-foreground/70 md:col-span-5 md:col-start-8">
                  Una barra cercana, cerveza bien servida y mesas hechas para quedarse un rato más.
                </p>
              </div>

              <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-12 md:gap-4 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
                {branch.gallery.map((photo, index) => (
                  <li
                    key={photo.src}
                    className={`relative w-[82%] shrink-0 snap-center overflow-hidden bg-muted sm:w-[58%] md:w-auto ${
                      index === 0
                        ? 'aspect-4/5 md:col-span-4 md:row-span-2'
                        : index === 1
                          ? 'aspect-4/3 md:col-span-8 md:aspect-16/9'
                          : 'aspect-4/5 md:col-span-4'
                    }`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 82vw"
                      className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </li>
                ))}
              </ul>
              <p className="label-xs mt-3 text-muted-foreground md:hidden">Desliza para ver más</p>
            </div>
          </section>
        ) : null}

        {/* Tap list */}
        <section id="tap-list" className="scroll-mt-20 border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <div className="flex items-end justify-between gap-4 border-b border-foreground/20 pb-5">
              <h2 className="display-tight text-4xl md:text-6xl">Tap list</h2>
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                {tapList && (
                  <p className="label-xs hidden text-muted-foreground sm:block">
                    {tapList.tap_list_items.length} llave{tapList.tap_list_items.length !== 1 ? 's' : ''} activa{tapList.tap_list_items.length !== 1 ? 's' : ''}
                  </p>
                )}
                <ShareTapListButton branchName={branch.name} />
              </div>
            </div>

            {tapList && tapList.tap_list_items.length > 0 ? (
              <ul>
                {tapList.tap_list_items.map((item, i) => (
                  <li
                    key={item.id}
                    className="border-b border-foreground/15 py-6 md:grid md:grid-cols-12 md:items-baseline md:gap-x-6 md:gap-y-2 md:py-5"
                  >
                    {/* Mobile composition */}
                    <div className="md:hidden">
                      <div className="flex min-h-5 items-center gap-4">
                        <span className="label-xs text-accent">
                          TAP {item.tap_number != null
                            ? String(item.tap_number).padStart(2, '0')
                            : String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="display-tight mt-4 text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.95] text-balance">
                        {item.beers.name}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.beers.brewery}</p>
                      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-4 border-t border-foreground/10 pt-4">
                        <div className="min-w-0">
                          <span className="label-xs text-foreground/35">ESTILO</span>
                          <p className="mt-1 text-sm leading-tight text-foreground/85">{item.beers.style}</p>
                        </div>
                        <div className="text-right">
                          <span className="label-xs text-foreground/35">ABV</span>
                          <p className="mt-1 font-mono text-sm">{item.beers.abv}%</p>
                        </div>
                        <div className="min-w-20 text-right">
                          <span className="label-xs text-foreground/35">PRECIO</span>
                          <p className="mt-1 font-mono text-sm font-semibold text-accent">
                            {item.serving_options.length > 0
                              ? `$${Number(item.serving_options.slice().sort((a, b) => a.display_order - b.display_order)[0].price).toFixed(0)}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tablet and desktop composition */}
                    <span className="label-xs hidden text-accent md:col-span-1 md:block">
                      {item.tap_number != null
                        ? String(item.tap_number).padStart(2, '0')
                        : String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="hidden md:col-span-4 md:block">
                      <h3 className="display-tight text-3xl">{item.beers.name}</h3>
                    </div>
                    <p className="hidden text-sm md:col-span-3 md:block">{item.beers.style}</p>
                    <p className="hidden text-sm text-muted-foreground md:col-span-2 md:block">{item.beers.brewery}</p>
                    <div className="hidden md:col-span-2 md:block">
                      <p className="label-xs text-right">{item.beers.abv}%</p>
                      {item.serving_options.length > 0 && (
                        <p className="label-xs mt-1 text-right text-muted-foreground">
                          ${Number(item.serving_options.slice().sort((a, b) => a.display_order - b.display_order)[0].price).toFixed(0)} MXN
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-sm text-muted-foreground" role={tapListError ? 'alert' : undefined}>
                {tapListError
                  ? 'No pudimos cargar el tap list en este momento. Intenta nuevamente o consulta con el bar.'
                  : 'Tap list en actualización. Consulta con el bar.'}
              </p>
            )}
          </div>
        </section>

        {branch.menu.length > 0 ? (
          <section aria-labelledby="menu-sucursal" className="border-b border-foreground/20">
            <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
              <div className="border-b border-foreground/20 pb-5">
                <p className="label-xs text-accent">Sólo en {branch.name}</p>
                <h2 id="menu-sucursal" className="display-tight mt-3 text-4xl md:text-6xl">
                  Menú
                </h2>
              </div>

              <div className="mt-10 grid gap-x-12 gap-y-14 lg:grid-cols-2">
                {branch.menu.map((section) => (
                  <section key={section.title} aria-labelledby={`menu-${section.title.toLowerCase().replaceAll(' ', '-')}`}>
                    <h3
                      id={`menu-${section.title.toLowerCase().replaceAll(' ', '-')}`}
                      className="display-tight border-b border-foreground/20 pb-4 text-3xl md:text-4xl"
                    >
                      {section.title}
                    </h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item.name} className="border-b border-foreground/15 py-5">
                          <div className="flex items-start justify-between gap-5">
                            <h4 className="text-base font-semibold uppercase tracking-wide md:text-lg">
                              {item.name}
                            </h4>
                            <p className="shrink-0 font-mono text-sm font-semibold text-accent md:text-base">
                              {item.price}
                            </p>
                          </div>
                          {item.description ? (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/65">
                              {item.description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Horarios */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <div className="max-w-xl">
              <h2 className="display-tight text-4xl md:text-5xl">Horarios</h2>
              <ul className="mt-6 border-t border-foreground/20">
                {branch.hours.map((slot) => (
                  <li
                    key={slot.days}
                    className="flex items-baseline justify-between border-b border-foreground/15 py-4 text-sm"
                  >
                    <span>{slot.days}</span>
                    <span className="tabular-nums">{slot.time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs uppercase tracking-[0.12em] text-foreground/60">
                Cerramos la barra 30 minutos antes
              </p>
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:grid-cols-12 md:gap-8 md:px-10 md:py-20">
            <div className="md:col-span-4">
              <h2 className="display-tight text-4xl md:text-5xl">Cómo llegar</h2>
              <p className="mt-6 text-base leading-relaxed text-foreground/80">
                {branch.address}
              </p>
              <a
                href={branch.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="label-xs group mt-8 inline-flex items-center gap-2 border-b-2 border-accent pb-2 font-semibold text-accent"
              >
                Abrir en Google Maps
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
            </div>

            <div className="border border-foreground/20 md:col-span-8">
              <iframe
                title={`Mapa de Craft ${branch.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  branch.mapEmbedQuery,
                )}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full md:h-96"
              />
            </div>
          </div>
        </section>

        {/* Otras sucursales */}
        <section>
          <div className="mx-auto max-w-[1600px] px-5 pt-14 md:px-10 md:pt-20">
            <h2 className="label-xs text-muted-foreground">Otras sucursales</h2>
          </div>
          <ul className="mt-8">
            {others.map((other) => (
              <li key={other.slug} className="border-t border-foreground/20">
                <Link
                  href={`/${other.slug}`}
                  className="group block transition-colors hover:bg-foreground hover:text-background"
                >
                  <div className="mx-auto flex max-w-[1600px] items-baseline justify-between gap-6 px-5 py-8 md:px-10">
                    <div className="flex items-baseline gap-6">
                      <span className="label-xs text-accent group-hover:text-background/45">
                        {other.index}
                      </span>
                      <h3 className="display-tight text-[clamp(2.25rem,5vw,4rem)]">
                        {other.name}
                      </h3>
                    </div>
                    <ArrowUpRight
                      className="size-6 shrink-0 text-accent transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
