'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Settings2, Globe, GlobeLock } from 'lucide-react'
import type { BeerRow, LocationRow, ProfileRow, TapListFull, TapListItemFull } from '@/lib/db-types'
import {
  addTapListItem,
  createDraftTapList,
  publishTapList,
  removeTapListItem,
  unpublishTapList,
  updateItemAvailability,
  updateItemBadge,
} from '@/app/admin/actions'
import { ServingOptionsModal } from './serving-options-modal'
import { AddBeerModal } from './add-beer-modal'

type Props = {
  locations: LocationRow[]
  tapLists: TapListFull[]
  allBeers: BeerRow[]
  profile: ProfileRow
}

const BADGE_LABELS: Record<string, string> = {
  new: 'NUEVO',
  limited: 'LIMITADO',
  guest: 'INVITADO',
  house: 'CASA',
}

const BADGE_COLORS: Record<string, string> = {
  new: 'text-green-400',
  limited: 'text-amber-400',
  guest: 'text-blue-400',
  house: 'text-accent',
}

export function TapListEditor({ locations, tapLists, allBeers, profile }: Props) {
  const [activeLocationId, setActiveLocationId] = useState(locations[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [servingItemId, setServingItemId] = useState<string | null>(null)
  const [showAddBeer, setShowAddBeer] = useState(false)

  const activeLocation = locations.find((l) => l.id === activeLocationId)
  const tapList = tapLists.find((t) => t.location_id === activeLocationId) ?? null
  const items: TapListItemFull[] = (tapList?.tap_list_items ?? []).slice().sort(
    (a, b) => a.display_order - b.display_order,
  )
  const isPublished = tapList?.status === 'published'
  const servingItem = items.find((i) => i.id === servingItemId) ?? null

  function handleCreateDraft() {
    startTransition(async () => {
      await createDraftTapList(activeLocationId)
    })
  }

  function handlePublishToggle() {
    if (!tapList) return
    startTransition(async () => {
      if (isPublished) await unpublishTapList(tapList.id)
      else await publishTapList(tapList.id)
    })
  }

  function handleAddBeer(beerId: string, tapNumber: string, badge: string, defaultPrice: string) {
    if (!tapList) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('tap_list_id', tapList.id)
      fd.set('beer_id', beerId)
      if (tapNumber) fd.set('tap_number', tapNumber)
      if (badge) fd.set('badge', badge)
      if (defaultPrice) fd.set('default_price', defaultPrice)
      await addTapListItem(fd)
    })
  }

  function handleRemoveItem(itemId: string) {
    startTransition(async () => {
      await removeTapListItem(itemId)
    })
  }

  function handleToggleAvailability(item: TapListItemFull) {
    startTransition(async () => {
      await updateItemAvailability(
        item.id,
        item.availability_status === 'available' ? 'unavailable' : 'available',
      )
    })
  }

  function handleBadgeChange(itemId: string, badge: string) {
    startTransition(async () => {
      await updateItemBadge(itemId, badge || null)
    })
  }

  return (
    <>
      <div className={`flex h-full flex-col transition-opacity ${isPending ? 'opacity-60' : ''}`}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6 px-8 pt-8 pb-6">
          <div>
            <p className="label-xs text-muted-foreground">Tap List</p>
            <h1 className="display-tight mt-1 text-4xl">{activeLocation?.name ?? '—'}</h1>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {tapList && (
              <>
                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[0.6rem] font-semibold tracking-widest ${
                    isPublished
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-foreground/15 text-foreground/40'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${isPublished ? 'bg-green-400' : 'bg-foreground/25'}`} />
                  {isPublished ? 'PUBLICADO' : 'BORRADOR'}
                </span>

                {/* Publish / unpublish */}
                <button
                  onClick={handlePublishToggle}
                  disabled={isPending}
                  title={isPublished ? 'Despublicar' : 'Publicar'}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest transition-colors disabled:opacity-40 ${
                    isPublished
                      ? 'border border-foreground/25 text-foreground/50 hover:border-foreground hover:text-foreground'
                      : 'bg-accent text-accent-foreground hover:bg-accent/85'
                  }`}
                >
                  {isPublished ? (
                    <><GlobeLock className="size-3.5" aria-hidden="true" /> DESPUBLICAR</>
                  ) : (
                    <><Globe className="size-3.5" aria-hidden="true" /> PUBLICAR</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Location tabs ─────────────────────────────────────────────────── */}
        <div className="flex border-b border-foreground/15 px-8">
          {locations.map((loc) => {
            const tl = tapLists.find((t) => t.location_id === loc.id)
            const isActive = loc.id === activeLocationId
            return (
              <button
                key={loc.id}
                onClick={() => setActiveLocationId(loc.id)}
                className={`relative px-4 py-3 text-[0.65rem] font-semibold tracking-widest transition-colors ${
                  isActive
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                    : 'text-foreground/40 hover:text-foreground/70'
                }`}
              >
                {loc.name.toUpperCase()}
                {tl?.status === 'published' && (
                  <span className="ml-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-green-400" />
                )}
              </button>
            )
          })}
        </div>

        {/* ── No tap list ───────────────────────────────────────────────────── */}
        {!tapList && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sin tap list para {activeLocation?.name}.
            </p>
            <button
              onClick={handleCreateDraft}
              disabled={isPending}
              className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              CREAR BORRADOR
            </button>
          </div>
        )}

        {/* ── Items table ───────────────────────────────────────────────────── */}
        {tapList && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-foreground/15">
                    <th className="label-xs w-12 px-8 py-3 text-left text-muted-foreground">TAP</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">CERVEZA</th>
                    <th className="label-xs hidden px-3 py-3 text-left text-muted-foreground md:table-cell">ESTILO</th>
                    <th className="label-xs hidden px-3 py-3 text-left text-muted-foreground lg:table-cell">ABV</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">BADGE</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">PRECIOS</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">ESTADO</th>
                    <th className="w-12 px-8 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-8 py-14 text-center text-sm text-muted-foreground">
                        Sin cervezas. Usa el botón de abajo para agregar la primera.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id} className="group transition-colors hover:bg-foreground/3">
                      {/* Tap number */}
                      <td className="px-8 py-4 font-mono text-xs text-muted-foreground">
                        {item.tap_number != null ? String(item.tap_number).padStart(2, '0') : '—'}
                      </td>

                      {/* Beer name + brewery */}
                      <td className="px-3 py-4">
                        <p className="font-semibold leading-tight text-foreground">{item.beers.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.beers.brewery}</p>
                      </td>

                      {/* Style */}
                      <td className="hidden px-3 py-4 text-xs text-foreground/60 md:table-cell">
                        {item.beers.style}
                      </td>

                      {/* ABV */}
                      <td className="hidden px-3 py-4 font-mono text-xs text-foreground/60 lg:table-cell">
                        {item.beers.abv}%
                      </td>

                      {/* Badge selector */}
                      <td className="px-3 py-4">
                        <select
                          value={item.badge ?? ''}
                          onChange={(e) => handleBadgeChange(item.id, e.target.value)}
                          disabled={isPending}
                          className={`bg-transparent text-[0.65rem] font-semibold tracking-widest focus:outline-none disabled:opacity-40 ${
                            item.badge ? BADGE_COLORS[item.badge] : 'text-foreground/30'
                          }`}
                        >
                          <option value="">—</option>
                          {Object.entries(BADGE_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </td>

                      {/* Serving options */}
                      <td className="px-3 py-4">
                        <button
                          onClick={() => setServingItemId(item.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-widest text-accent transition-colors hover:text-accent/70 disabled:opacity-40"
                        >
                          <Settings2 className="size-3" aria-hidden="true" />
                          {item.serving_options.length > 0
                            ? `${item.serving_options.length} PRECIO${item.serving_options.length > 1 ? 'S' : ''}`
                            : 'AGREGAR'}
                        </button>
                      </td>

                      {/* Availability toggle */}
                      <td className="px-3 py-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          disabled={isPending}
                          className={`text-[0.65rem] font-semibold tracking-widest transition-colors disabled:opacity-40 ${
                            item.availability_status === 'available'
                              ? 'text-green-400 hover:text-green-300'
                              : 'text-foreground/25 line-through hover:text-foreground/50'
                          }`}
                        >
                          {item.availability_status === 'available' ? 'DISPONIBLE' : 'AGOTADO'}
                        </button>
                      </td>

                      {/* Remove */}
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isPending}
                          aria-label={`Eliminar ${item.beers.name}`}
                          className="text-foreground/15 transition-colors hover:text-accent group-hover:text-foreground/40 disabled:opacity-30"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Footer row ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-t border-foreground/10 px-8 py-4">
              <button
                onClick={() => setShowAddBeer(true)}
                disabled={isPending}
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent transition-colors hover:text-accent/70 disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                AGREGAR CERVEZA
              </button>
              <span className="label-xs text-muted-foreground">
                {items.length} cerveza{items.length !== 1 ? 's' : ''}
                {tapList.published_at ? (
                  <> · Publicado {new Date(tapList.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</>
                ) : null}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAddBeer && tapList && (
        <AddBeerModal
          beers={allBeers}
          onAdd={(beerId, tapNumber, badge, defaultPrice) => {
            handleAddBeer(beerId, tapNumber, badge, defaultPrice)
            setShowAddBeer(false)
          }}
          onClose={() => setShowAddBeer(false)}
        />
      )}

      {servingItem && (
        <ServingOptionsModal
          item={servingItem}
          onClose={() => setServingItemId(null)}
        />
      )}
    </>
  )
}
