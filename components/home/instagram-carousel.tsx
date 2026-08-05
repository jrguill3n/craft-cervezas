'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { instagramProfile, type InstagramPost } from '@/lib/instagram/types'
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

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

function formatDate(iso: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return dateFormatter.format(date).replace('.', '').toUpperCase()
}

const aspectClass: Record<InstagramPost['aspect'], string> = {
  square: 'aspect-square',
  portrait: 'aspect-4/5',
  landscape: 'aspect-video',
}

export function InstagramCarousel({ posts }: { posts: InstagramPost[] }) {
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
    <>
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

      <ul
        ref={trackRef}
        onScroll={syncControls}
        className="col-span-full mt-10 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => {
          const published = formatDate(post.publishedAt)
          const isMotion = post.mediaType === 'reel' || post.mediaType === 'video'

          return (
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
                    'relative overflow-hidden border border-foreground/15 bg-muted',
                    aspectClass[post.aspect],
                  )}
                >
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.caption || 'Publicación de Craft en Instagram'}
                      fill
                      sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 78vw"
                      className="object-cover"
                    />
                  ) : (
                    // Sin portada disponible: bloque tipográfico centrado que
                    // preserva la retícula y sigue llevando al post original.
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center transition-colors group-hover:bg-foreground/5">
                      <InstagramGlyph className="size-7 text-accent" />
                      <span className="label-xs text-foreground/70">
                        Publicación en Instagram
                      </span>
                    </div>
                  )}

                  {isMotion && post.image ? (
                    <span className="absolute top-3 right-3 flex size-7 items-center justify-center bg-background/70">
                      <Play className="size-3.5 fill-current" aria-hidden="true" />
                      <span className="sr-only">Video</span>
                    </span>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/75 px-3 py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <InstagramGlyph className="size-4 shrink-0" />
                    <span className="label-xs">Ver publicación</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  {published ? (
                    <time
                      dateTime={post.publishedAt ?? undefined}
                      className="label-xs shrink-0 text-muted-foreground"
                    >
                      {published}
                    </time>
                  ) : null}
                  {post.caption ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-foreground/75">
                      {post.caption}
                    </p>
                  ) : null}
                </div>
              </a>
            </li>
          )
        })}
      </ul>

      <a
        href={instagramProfile.url}
        target="_blank"
        rel="noopener noreferrer"
        className="label-xs col-span-full mt-8 inline-flex w-fit items-center gap-2 font-semibold text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Seguir {instagramProfile.handle}
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </>
  )
}
