import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle, Phone } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
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

  const [tapList, others] = await Promise.all([
    getPublishedTapList(sucursal),
    Promise.resolve(branches.filter((item) => item.slug !== branch.slug)),
  ])

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

        {/* Tap list */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <div className="flex items-baseline justify-between gap-6 border-b border-foreground/20 pb-5">
              <h2 className="display-tight text-4xl md:text-6xl">Tap list</h2>
              {tapList && (
                <p className="label-xs text-muted-foreground">
                  {tapList.tap_list_items.length} llave{tapList.tap_list_items.length !== 1 ? 's' : ''} activa{tapList.tap_list_items.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {tapList && tapList.tap_list_items.length > 0 ? (
              <ul>
                {tapList.tap_list_items.map((item, i) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-2 items-baseline gap-x-6 gap-y-2 border-b border-foreground/15 py-5 md:grid-cols-12"
                  >
                    <span className="label-xs text-accent md:col-span-1">
                      {item.tap_number != null
                        ? String(item.tap_number).padStart(2, '0')
                        : String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="col-span-2 md:col-span-4">
                      <h3 className="display-tight text-2xl md:text-3xl">{item.beers.name}</h3>
                      {item.badge && (
                        <span className="label-xs mt-1 inline-block text-accent">
                          {item.badge.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:col-span-3">{item.beers.style}</p>
                    <p className="text-sm text-muted-foreground md:col-span-2">{item.beers.brewery}</p>
                    <div className="md:col-span-2">
                      <p className="label-xs text-right">{item.beers.abv}%</p>
                      {item.serving_options.length > 0 && (
                        <ul className="mt-1 flex flex-wrap justify-end gap-x-3 gap-y-0.5">
                          {item.serving_options
                            .slice()
                            .sort((a, b) => a.display_order - b.display_order)
                            .map((opt) => (
                              <li key={opt.id} className="label-xs text-muted-foreground">
                                {opt.size} · ${opt.price.toFixed(0)} MXN
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-sm text-muted-foreground">
                Tap list en actualización. Consulta con el bar.
              </p>
            )}
          </div>
        </section>

        {/* Menú */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <h2 className="display-tight text-4xl md:text-6xl">Menú</h2>
            <div className="mt-10 grid gap-10 border-t border-foreground/20 pt-8 md:grid-cols-3 md:gap-8">
              {branch.menu.map((section) => (
                <div key={section.title}>
                  <h3 className="label-xs text-muted-foreground">{section.title}</h3>
                  <ul className="mt-6 flex flex-col">
                    {section.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-baseline justify-between gap-4 border-b border-foreground/15 py-4"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm tabular-nums">{item.price}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promociones + horarios */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 md:grid-cols-12 md:gap-8 md:px-10 md:py-20">
            <div className="md:col-span-7">
              <h2 className="display-tight text-4xl md:text-5xl">Promociones y eventos</h2>
              <ul className="mt-8 border-t border-foreground/20">
                {branch.promos.map((promo) => (
                  <li
                    key={promo.title}
                    className="grid gap-x-6 gap-y-1 border-b border-foreground/15 py-6 md:grid-cols-12"
                  >
                    <span className="label-xs text-accent md:col-span-3">{promo.day}</span>
                    <h3 className="display-tight text-2xl md:col-span-4">{promo.title}</h3>
                    <p className="text-sm text-foreground/75 md:col-span-5">{promo.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 md:col-start-9">
              <h2 className="label-xs text-muted-foreground">Horarios</h2>
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
