import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TapListCatalog, type LocationFilter } from '@/components/tap-list-catalog'
import type { TapListFull } from '@/lib/db-types'
import { getAllPublishedTapLists } from '@/lib/tap-list'

export const metadata: Metadata = {
  title: 'Tap Lists',
  description: 'Cervezas disponibles hoy en las barras de Craft Cervezas.',
}
export const dynamic = 'force-dynamic'

const VALID_LOCATIONS = new Set<LocationFilter>(['americana', 'chapalita', 'providencia', 'insurgente-gdl'])

export default async function TapListsPage({
  searchParams,
}: {
  searchParams: Promise<{ ubicacion?: string }>
}) {
  const { ubicacion } = await searchParams
  const initialLocation: LocationFilter = ubicacion && VALID_LOCATIONS.has(ubicacion as LocationFilter)
    ? ubicacion as LocationFilter
    : 'americana'

  let tapLists: TapListFull[] = []
  let loadFailed = false
  try {
    tapLists = await getAllPublishedTapLists()
  } catch (error) {
    loadFailed = true
    console.error('[tap-lists-page] Could not load published tap lists:', error)
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-20">
          <p className="label-xs text-accent">En barra hoy</p>
          <h1 className="display-tight mt-4 text-[clamp(3.5rem,10vw,8rem)]">Tap Lists</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Cervezas disponibles hoy. Selecciona una sucursal para ver qué hay en barra.
          </p>
        </section>
        {loadFailed ? (
          <section className="border-y border-foreground/20">
            <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10">
              <p className="display-tight text-3xl">No pudimos cargar los tap lists</p>
              <p className="mt-3 text-sm text-muted-foreground">Intenta nuevamente en unos minutos.</p>
            </div>
          </section>
        ) : (
          <TapListCatalog tapLists={tapLists} initialLocation={initialLocation} />
        )}
      </main>
      <SiteFooter />
    </>
  )
}
