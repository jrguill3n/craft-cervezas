import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUpRight, MessageCircle, Phone } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { branches, getBranch } from '@/lib/craft-content'

export function generateStaticParams() {
  return branches.map((branch) => ({ sucursal: branch.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sucursal: string }>
}): Promise<Metadata> {
  const { sucursal } = await params
  const branch = getBranch(sucursal)
  if (!branch) return {}
  return {
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
  const branch = getBranch(sucursal)
  if (!branch) notFound()

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

        {/* Tap list */}
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <div className="flex items-baseline justify-between gap-6 border-b border-foreground/20 pb-5">
              <h2 className="display-tight text-4xl md:text-6xl">Tap list</h2>
              <p className="label-xs text-muted-foreground">
                {branch.taps.length} llaves activas
              </p>
            </div>

            <ul>
              {branch.taps.map((tap, i) => (
                <li
                  key={tap.name}
                  className="grid grid-cols-2 items-baseline gap-x-6 gap-y-2 border-b border-foreground/15 py-5 md:grid-cols-12"
                >
                  <span className="label-xs text-accent md:col-span-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="display-tight col-span-2 text-2xl md:col-span-4 md:text-3xl">
                    {tap.name}
                  </h3>
                  <p className="text-sm md:col-span-3">{tap.style}</p>
                  <p className="text-sm text-muted-foreground md:col-span-2">{tap.origin}</p>
                  <p className="label-xs text-right md:col-span-2">
                    {tap.abv}
                    {tap.ibu ? ` · ${tap.ibu} IBU` : ''}
                  </p>
                </li>
              ))}
            </ul>
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
