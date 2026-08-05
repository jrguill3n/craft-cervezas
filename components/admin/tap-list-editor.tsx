'use client'

import { useState, useTransition } from 'react'
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

export function TapListEditor({ locations, tapLists, allBeers, profile }: Props) {
  const [activeLocationId, setActiveLocationId] = useState(locations[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [servingItemId, setServingItemId] = useState<string | null>(null)
  const [showAddBeer, setShowAddBeer] = useState(false)

  const activeLocation = locations.find((l) => l.id === activeLocationId)
  const tapList = tapLists.find((t) => t.location_id === activeLocationId) ?? null
  const items = tapList?.tap_list_items ?? []
  const isPublished = tapList?.status === 'published'
  const servingItem = items.find((i) => i.id === servingItemId) ?? null

  function handleCreateDraft() {
    startTransition(async () => {
      await createDraftTapList(activeLocationId)
    })
  }

  function handlePublish() {
    if (!tapList) return
    startTransition(async () => {
      if (isPublished) await unpublishTapList(tapList.id)
      else await publishTapList(tapList.id)
    })
  }

  function handleAddBeer(beerId: string, tapNumber: string, badge: string) {
    if (!tapList) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('tap_list_id', tapList.id)
      fd.set('beer_id', beerId)
      if (tapNumber) fd.set('tap_number', tapNumber)
      if (badge) fd.set('badge', badge)
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
    <div className="flex h-full flex-col px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Tap List</h1>
        </div>

        {tapList && (
          <button
            onClick={handlePublish}
            disabled={isPending}
            className={`px-5 py-2.5 text-xs font-semibold tracking-widest transition-colors disabled:opacity-40 ${
              isPublished
                ? 'border border-foreground/30 text-foreground/60 hover:border-foreground hover:text-foreground'
                : 'bg-accent text-background hover:bg-accent/80'
            }`}
          >
            {isPublished ? 'DESPUBLICAR' : 'PUBLICAR'}
          </button>
        )}
      </div>

      {/* Location tabs */}
      <div className="mb-6 flex gap-0 border-b border-foreground/10">
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setActiveLocationId(loc.id)}
            className={`px-5 py-3 text-xs font-semibold tracking-widest transition-colors ${
              activeLocationId === loc.id
                ? 'border-b-2 border-foreground text-foreground'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            {loc.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Status pill */}
      {tapList && (
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-semibold tracking-widest ${
              isPublished ? 'bg-green-500/10 text-green-400' : 'bg-foreground/10 text-foreground/50'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${isPublished ? 'bg-green-400' : 'bg-foreground/30'}`}
            />
            {isPublished ? 'PUBLICADO' : 'BORRADOR'}
          </span>
          {tapList.published_at && (
            <span className="text-[0.65rem] text-muted-foreground">
              Última publicación:{' '}
              {new Date(tapList.published_at).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* No tap list yet */}
      {!tapList && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sin tap list para {activeLocation?.name}.
          </p>
          <button
            onClick={handleCreateDraft}
            disabled={isPending}
            className="border border-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            CREAR BORRADOR
          </button>
        </div>
      )}

      {/* Items table */}
      {tapList && (
        <>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-left">
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">TAP</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">CERVEZA</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">ESTILO</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">ABV</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">BADGE</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">OPCIONES</th>
                  <th className="label-xs pb-3 pr-4 text-muted-foreground">ESTADO</th>
                  <th className="label-xs pb-3 text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Sin cervezas. Agrega la primera abajo.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {item.tap_number ?? '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-foreground">{item.beers.name}</p>
                      <p className="text-xs text-muted-foreground">{item.beers.brewery}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-foreground/70">{item.beers.style}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/70">
                      {item.beers.abv}%
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={item.badge ?? ''}
                        onChange={(e) => handleBadgeChange(item.id, e.target.value)}
                        disabled={isPending}
                        className="bg-transparent text-[0.65rem] tracking-widest text-foreground/60 focus:outline-none disabled:opacity-40"
                      >
                        <option value="">—</option>
                        {Object.entries(BADGE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setServingItemId(item.id)}
                        className="text-[0.65rem] tracking-widest text-accent hover:underline"
                      >
                        {item.serving_options.length > 0
                          ? `${item.serving_options.length} opción${item.serving_options.length > 1 ? 'es' : ''}`
                          : 'AGREGAR'}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={isPending}
                        className={`text-[0.65rem] font-semibold tracking-widest transition-colors disabled:opacity-40 ${
                          item.availability_status === 'available'
                            ? 'text-green-400'
                            : 'text-foreground/30 line-through'
                        }`}
                      >
                        {item.availability_status === 'available' ? 'DISPONIBLE' : 'AGOTADO'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isPending}
                        className="text-xs text-foreground/20 transition-colors hover:text-accent group-hover:text-foreground/40 disabled:opacity-30"
                        aria-label="Eliminar cerveza"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add beer row */}
          <div className="mt-4 border-t border-foreground/10 pt-4">
            <button
              onClick={() => setShowAddBeer(true)}
              disabled={isPending}
              className="text-xs font-semibold tracking-widest text-accent hover:underline disabled:opacity-40"
            >
              + AGREGAR CERVEZA
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {showAddBeer && tapList && (
        <AddBeerModal
          beers={allBeers}
          onAdd={(beerId, tapNumber, badge) => {
            handleAddBeer(beerId, tapNumber, badge)
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
    </div>
  )
}
