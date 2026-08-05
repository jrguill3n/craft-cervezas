'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { instagramPosts, instagramProfile } from '@/lib/instagram-feed'
import { cn } from '@/lib/utils'

/** Glifo de Instagram. lucide ya no incluye marcas comerciales. */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InstagramFeed() {
  const trackRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const syncControls = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setCanPrev(track.scrollLeft > 8)
    setCanNext(track.scrollLeft < max - 8)
  }, [])

  useEffect(() => {
    syncControls()
    window.addEventListener('resize', syncControls)
    return () => window.removeEventListener('resize', syncControls)
  }, [syncControls])

  const scrollByPost = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const first = track.firstElementChild as HTMLElement | null
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || '16') || 16
    const step = (first?.offsetWidth ?? track.clientWidth * 0.8) + gap
    track.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="instagram-title" className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid items-baseline gap-4 md:grid-cols-12">
          <h2 id="instagram-title" className="label-xs text-muted-foreground md:col-span-3">
            Lo que está pasando en Craft
          </h2>
          <p className="max-w-xl text-lg leading-relaxed md:col-span-6 md:col-start-4 md:text-xl">
            Eventos, nuevos lanzamientos y momentos de nuestras sucursales.
          </p>

          <div className="hidden md:col-span-2 md:col-start-11 md:flex md:justify-end md:gap-2">
            <button
              type="button"
              onClick={() => scrollByPost(-1)}
              disabled={!canPrev}
              aria-label="Ver publicaciones anteriores"
              className="flex size-10 items-center justify-center border border-accent text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:border-foreground/25 disabled:text-foreground/25 disabled:hover:bg-transparent disabled:hover:text-foreground/25"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPost(1)}
              disabled={!canNext}
              aria-label="Ver publicaciones siguientes"
              className="flex size-10 items-center justify-center border border-accent text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:border-foreground/25 disabled:text-foreground/25 disabled:hover:bg-transparent disabled:hover:text-foreground/25"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <ul
          ref={trackRef}
          onScroll={syncControls}
          className="mt-10 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {instagramPosts.map((post) => (
            <li
              key={post.id}
              className="w-[78%] flex-none snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
            >
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <div
                  className={cn(
                    'relative overflow-hidden bg-muted',
                    post.aspect === 'portrait' ? 'aspect-4/5' : 'aspect-square',
                  )}
                >
                  <Image
                    src={post.image}
                    alt={post.alt}
                    fill
                    sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 78vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/75 px-3 py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <InstagramGlyph className="size-4 shrink-0" />
                    <span className="label-xs">Ver publicación</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{post.caption}</p>
              </a>
            </li>
          ))}
        </ul>

        <a
          href={instagramProfile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="label-xs mt-8 inline-flex items-center gap-2 font-semibold text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Seguir {instagramProfile.handle}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
