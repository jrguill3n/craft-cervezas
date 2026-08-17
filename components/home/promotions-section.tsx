import Image from 'next/image'
import type { PromotionRow } from '@/lib/db-types'
import { createPublicClient } from '@/lib/supabase/public'

async function getActivePromotions() {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(6)

    if (error) return { promotions: [], error: error.message }
    return { promotions: (data ?? []) as PromotionRow[], error: null }
  } catch (error) {
    return {
      promotions: [],
      error: error instanceof Error ? error.message : 'No se pudieron cargar las promociones.',
    }
  }
}

function PromotionPoster({ promotion }: { promotion: PromotionRow }) {
  return (
    <a
      href={promotion.instagram_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${promotion.title}, abrir en Instagram`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden border border-foreground/15 bg-foreground/5">
        <Image
          src={promotion.image_url}
          alt={promotion.title}
          fill
          sizes="(min-width: 1280px) 15vw, (min-width: 768px) 30vw, 72vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized={promotion.image_url.startsWith('http')}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <h3 className="truncate text-sm font-semibold text-foreground">{promotion.title}</h3>
        <span className="label-xs shrink-0 text-accent">IG ↗</span>
      </div>
    </a>
  )
}

export function PromotionsSectionSkeleton() {
  return (
    <section className="border-t border-foreground/20 px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="h-4 w-48 bg-foreground/10" />
        <div className="mt-4 h-12 w-72 bg-foreground/10" />
        <div className="mt-10 hidden grid-cols-3 gap-4 md:grid xl:grid-cols-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] bg-foreground/10" />
          ))}
        </div>
      </div>
    </section>
  )
}

export async function PromotionsSection() {
  const { promotions, error } = await getActivePromotions()

  if (promotions.length === 0 && !error) return null

  return (
    <section className="border-t border-foreground/20 px-5 py-16 md:px-10 md:py-24" aria-labelledby="promotions-heading">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-col gap-3 border-b border-foreground/15 pb-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-xs text-accent">NOVEDADES</p>
            <h2 id="promotions-heading" className="display-tight mt-3 text-4xl md:text-6xl">
              Promociones y eventos
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground md:text-right">
            Lo que está pasando en Craft.
          </p>
        </div>

        {error ? (
          <div className="border border-foreground/15 px-5 py-8">
            <p className="text-sm font-semibold">No pudimos cargar las promociones.</p>
            <p className="mt-2 text-xs text-muted-foreground">Intenta de nuevo más tarde.</p>
          </div>
        ) : (
          <>
            <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 [-webkit-overflow-scrolling:touch] md:hidden">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="w-[72vw] shrink-0 snap-start">
                  <PromotionPoster promotion={promotion} />
                </div>
              ))}
            </div>

            <div className="hidden grid-cols-3 gap-4 md:grid xl:grid-cols-6">
              {promotions.map((promotion) => (
                <PromotionPoster key={promotion.id} promotion={promotion} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
