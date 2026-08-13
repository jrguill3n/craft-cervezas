import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { branches, getBranch } from '@/lib/craft-content'

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
                <p className="text-base leading-relaxed text-foreground/80">
                  {branch.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/taplist?ubicacion=${branch.slug}`}
                    className="label-xs inline-flex items-center gap-2 bg-accent px-5 py-3 font-semibold text-accent-foreground"
                  >
                    Ver Tap List
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
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
