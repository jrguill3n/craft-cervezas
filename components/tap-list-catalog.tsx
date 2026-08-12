'use client'

import { useEffect, useMemo, useState } from 'react'
import type { TapListFull } from '@/lib/db-types'

const FILTERS = [
  { label: 'Todas', value: 'todas' },
  { label: 'Chapalita', value: 'chapalita' },
  { label: 'Americana', value: 'americana' },
  { label: 'Providencia', value: 'providencia' },
] as const

type LocationFilter = (typeof FILTERS)[number]['value']

function isLocationFilter(value: string | null): value is LocationFilter {
  return FILTERS.some((filter) => filter.value === value)
}

export function TapListCatalog({
  tapLists,
  initialLocation,
}: {
  tapLists: TapListFull[]
  initialLocation: LocationFilter
}) {
  const [location, setLocation] = useState<LocationFilter>(initialLocation)

  useEffect(() => {
    setLocation(initialLocation)
  }, [initialLocation])

  useEffect(() => {
    function syncFromHistory() {
      const value = new URL(window.location.href).searchParams.get('ubicacion')
      setLocation(isLocationFilter(value) ? value : 'todas')
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [])

  const visibleLists = useMemo(
    () => location === 'todas'
      ? tapLists
      : tapLists.filter((list) => list.locations.slug === location),
    [location, tapLists],
  )

  function selectLocation(nextLocation: LocationFilter) {
    setLocation(nextLocation)
    const url = new URL(window.location.href)
    if (nextLocation === 'todas') url.searchParams.delete('ubicacion')
    else url.searchParams.set('ubicacion', nextLocation)
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <>
      <div className="sticky top-0 z-20 border-y border-foreground/20 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] overflow-x-auto px-5 md:px-10">
          <div className="flex min-w-max" role="group" aria-label="Filtrar tap lists por sucursal">
            {FILTERS.map((filter) => {
              const active = location === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => selectLocation(filter.value)}
                  aria-pressed={active}
                  className={`label-xs relative min-h-14 px-4 font-semibold transition-colors md:px-6 ${
                    active
                      ? 'text-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-accent md:after:inset-x-6'
                      : 'text-foreground/45 hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-16">
        {visibleLists.length > 0 ? (
          <div className="space-y-16 md:space-y-24">
            {visibleLists.map((list) => (
              <section key={list.id} aria-labelledby={`taplist-${list.locations.slug}`}>
                <div className="flex items-end justify-between gap-5 border-b border-foreground/25 pb-5">
                  <div>
                    <p className="label-xs text-accent">Sucursal</p>
                    <h2 id={`taplist-${list.locations.slug}`} className="display-tight mt-2 text-4xl md:text-6xl">
                      {list.locations.name}
                    </h2>
                  </div>
                  <p className="label-xs text-muted-foreground">
                    {list.tap_list_items.length} tap{list.tap_list_items.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {list.tap_list_items.length > 0 ? (
                  <ul>
                    {list.tap_list_items.map((item, index) => {
                      const option = item.serving_options.slice().sort((a, b) => a.display_order - b.display_order)[0]
                      return (
                        <li key={item.id} className="border-b border-foreground/15 py-5 md:grid md:grid-cols-12 md:items-baseline md:gap-6">
                          <div className="flex items-start gap-4 md:col-span-5">
                            <span className="label-xs w-8 shrink-0 pt-1 text-accent">
                              {String(item.tap_number ?? index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <h3 className="display-tight text-2xl leading-none md:text-3xl">{item.beers.name}</h3>
                              <p className="mt-2 text-sm text-muted-foreground">{item.beers.brewery}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 pl-12 md:col-span-7 md:mt-0 md:grid-cols-7 md:gap-6 md:pl-0">
                            <p className="text-sm text-foreground/80 md:col-span-3">{item.beers.style}</p>
                            <p className="font-mono text-sm md:col-span-1 md:text-right">{item.beers.abv}%</p>
                            <p className="text-right text-sm md:col-span-3">
                              {option ? (
                                <>
                                  <span className="text-muted-foreground">{option.label || option.size}</span>
                                  {' '}
                                  <span className="ml-2 font-mono font-semibold text-accent">
                                    ${Number(option.price).toFixed(0)}
                                  </span>
                                </>
                              ) : '—'}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="py-10 text-sm text-muted-foreground">Esta sucursal está actualizando su tap list.</p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="border border-foreground/20 px-5 py-14 text-center">
            <p className="display-tight text-3xl">Tap list en actualización</p>
            <p className="mt-3 text-sm text-muted-foreground">Esta sucursal todavía no tiene una lista publicada.</p>
          </div>
        )}
      </div>
    </>
  )
}

export type { LocationFilter }
