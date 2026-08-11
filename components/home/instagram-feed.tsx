import { Suspense } from 'react'
import { getInstagramFeed } from '@/lib/instagram/feed'
import { INSTAGRAM_POST_LIMIT } from '@/lib/instagram/types'
import { InstagramCarousel } from './instagram-carousel'

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="instagram-title" className="border-b border-foreground/20">
      <div className="mx-auto grid max-w-[1600px] items-baseline gap-4 px-5 py-14 md:grid-cols-12 md:px-10 md:py-20">
        <h2 id="instagram-title" className="label-xs text-muted-foreground md:col-span-3">
          Lo que está pasando en Craft
        </h2>
        <p className="max-w-xl text-lg leading-relaxed md:col-span-6 md:col-start-4 md:text-xl">
          Eventos, nuevos lanzamientos y momentos de nuestras sucursales.
        </p>
        {children}
      </div>
    </section>
  )
}

/** Marco de carga: reserva el alto del carrusel para no desplazar la página. */
function CarouselSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="col-span-full mt-10 flex items-start gap-4 overflow-hidden pb-2"
    >
      {Array.from({ length: INSTAGRAM_POST_LIMIT }).map((_, index) => (
        <li
          key={index}
          className="w-[78%] flex-none sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
        >
          <div className="aspect-square animate-pulse border border-foreground/15 bg-muted" />
          <div className="mt-3 h-4 w-2/3 animate-pulse bg-muted" />
        </li>
      ))}
    </ul>
  )
}

async function InstagramCarouselLoader() {
  const { posts } = await getInstagramFeed()
  if (posts.length === 0) return null
  return <InstagramCarousel posts={posts} />
}

export function InstagramFeed() {
  return (
    <SectionShell>
      {/* La obtención ocurre dentro del límite de Suspense, así que el resto de
          la portada se transmite sin esperar la respuesta de Instagram. */}
      <Suspense fallback={<CarouselSkeleton />}>
        <InstagramCarouselLoader />
      </Suspense>
    </SectionShell>
  )
}
