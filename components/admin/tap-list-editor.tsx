'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Settings2, Globe, Pencil, ChevronDown } from 'lucide-react'
import type { BeerRow, LocationRow, ProfileRow, TapListFull, TapListItemFull } from '@/lib/db-types'
import {
  addTapListItem,
  createDraftTapList,
  publishTapList,
  removeTapListItem,
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
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      try {
        await publishTapList(tapList.id)
        setConfirmPublish(false)
        setMessage('Tap list publicado correctamente.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo publicar el tap list.')
      }
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
    <>
      <div className={`flex h-full flex-col transition-opacity ${isPending ? 'opacity-60' : ''}`}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 px-4 pt-5 pb-4 md:items-center md:px-6 md:pt-8 md:pb-6 xl:px-8">
          <div className="min-w-0">
            <p className="label-xs text-muted-foreground">Tap List</p>
            <h1 className="display-tight mt-2 truncate text-4xl md:text-5xl">{activeLocation?.name ?? '—'}</h1>
            <p className="mt-2 text-xs text-muted-foreground">{items.length} cerveza{items.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 md:flex-row md:items-center md:gap-3">
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

                {isPublished && (
                  <button onClick={handleCreateDraft} disabled={isPending} className="inline-flex min-h-11 items-center gap-2 border border-foreground/25 px-3 text-[0.65rem] font-semibold tracking-widest md:px-4 md:text-xs">
                    <Pencil className="size-4" aria-hidden="true" /> <span className="md:hidden">EDITAR</span><span className="hidden md:inline">PREPARAR CAMBIOS</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Location tabs ─────────────────────────────────────────────────── */}
        <div className="border-y border-foreground/15 px-4 py-3 md:hidden">
          <label htmlFor="admin-location" className="label-xs mb-2 block text-muted-foreground">SUCURSAL</label>
          <div className="relative">
            <select
              id="admin-location"
              value={activeLocationId}
              onChange={(event) => setActiveLocationId(event.target.value)}
              className="min-h-14 w-full appearance-none border border-foreground/25 bg-background px-4 pr-12 text-base font-semibold tracking-wide text-foreground focus:border-accent focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-accent" aria-hidden="true" />
          </div>
        </div>
        <div className="hidden overflow-x-auto border-b border-foreground/15 px-2 md:flex md:px-4 xl:px-8">
          {locations.map((loc) => {
            const tl = tapLists.find((t) => t.location_id === loc.id)
            const isActive = loc.id === activeLocationId
            return (
              <button
                key={loc.id}
                onClick={() => setActiveLocationId(loc.id)}
                className={`relative min-h-11 shrink-0 px-4 py-3 text-[0.65rem] font-semibold tracking-widest transition-colors ${
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
          <div className="flex flex-1 flex-col overflow-hidden pb-24 md:pb-0">
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-foreground/10 px-4 xl:hidden">
                {items.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Sin cervezas. Agrega la primera.</p>}
                {items.map((item) => (
                  <article key={item.id} className="py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="display-tight w-9 shrink-0 text-center text-2xl text-accent">{item.tap_number ?? '—'}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold">{item.beers.name}</h3>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{item.beers.brewery} · {item.beers.style} · {item.beers.abv}%</p>
                      </div>
                      <button onClick={() => setServingItemId(item.id)} disabled={isPending || isPublished} className={`inline-flex min-h-11 shrink-0 items-center gap-2 border px-3 text-sm font-semibold disabled:opacity-60 ${(item.serving_options.length || item.beers.default_price) ? 'border-foreground/15 text-foreground' : 'border-accent/40 text-accent'}`}>
                        <Settings2 className="size-4 text-accent" aria-hidden="true" />
                        {item.serving_options.length ? item.serving_options.map((option) => `$${Number(option.price).toFixed(0)}`).join('/') : item.beers.default_price ? `$${Number(item.beers.default_price).toFixed(0)}` : 'AGREGAR PRECIO'}
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 pl-12">
                      <button onClick={() => handleToggleAvailability(item)} disabled={isPending || isPublished} aria-pressed={item.availability_status === 'available'} aria-label={`Estado de ${item.beers.name}: ${item.availability_status === 'available' ? 'disponible' : 'agotado'}. Toca para cambiar.`} className={`inline-flex min-h-12 items-center gap-2 border px-3 text-xs font-semibold tracking-wide disabled:opacity-60 ${item.availability_status === 'available' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-foreground/20 text-foreground/55'}`}>
                        <span className={`size-2 rounded-full ${item.availability_status === 'available' ? 'bg-green-400' : 'bg-foreground/30'}`} aria-hidden="true" />
                        {item.availability_status === 'available' ? 'Disponible' : 'Agotado'}
                      </button>
                      <div className="relative min-w-0 flex-1">
                        <select value={item.badge ?? ''} onChange={(event) => handleBadgeChange(item.id, event.target.value)} disabled={isPending || isPublished} aria-label={`Badge de ${item.beers.name}`} className={`min-h-12 w-full appearance-none border border-foreground/20 bg-background px-3 pr-9 text-xs font-semibold tracking-wide disabled:opacity-60 ${item.badge ? BADGE_COLORS[item.badge] : 'text-foreground/55'}`}>
                          <option value="">Sin badge</option>
                          {Object.entries(BADGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-accent" aria-hidden="true" />
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} disabled={isPending || isPublished} className="inline-flex size-12 shrink-0 items-center justify-center border border-foreground/15 text-accent disabled:opacity-30" aria-label={`Quitar ${item.beers.name}`}><X className="size-4" aria-hidden="true" /></button>
                    </div>
                  </article>
                ))}
              </div>
              <table className="hidden w-full text-sm xl:table">
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
                          disabled={isPending || isPublished}
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
                          disabled={isPending || isPublished}
                          className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-widest text-accent transition-colors hover:text-accent/70 disabled:opacity-40"
                        >
                          <Settings2 className="size-3" aria-hidden="true" />
                          {item.serving_options.length > 0
                            ? item.serving_options
                                .slice()
                                .sort((a, b) => a.display_order - b.display_order)
                                .map((option) => `$${Number(option.price).toFixed(0)}`)
                                .join(' / ')
                            : 'PRECIO PENDIENTE'}
                        </button>
                      </td>

                      {/* Availability toggle */}
                      <td className="px-3 py-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          disabled={isPending || isPublished}
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
                          disabled={isPending || isPublished}
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
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-foreground/15 bg-background px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,.22)] md:static md:px-6 md:shadow-none xl:px-8 xl:py-4">
              <button
                onClick={() => setShowAddBeer(true)}
                disabled={isPending || isPublished}
                className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-widest text-accent transition-colors hover:text-accent/70 disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span className="sm:hidden">AGREGAR</span><span className="hidden sm:inline">AGREGAR CERVEZA</span>
              </button>
              <span className="label-xs hidden text-muted-foreground md:inline">
                {items.length} cerveza{items.length !== 1 ? 's' : ''}
                {tapList.published_at ? (
                  <> · Publicado {new Date(tapList.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</>
                ) : null}
              </span>
              {!isPublished && (
                <button onClick={() => setConfirmPublish(true)} disabled={isPending || items.length === 0} className="inline-flex min-h-11 items-center gap-2 bg-accent px-4 text-xs font-semibold tracking-widest text-accent-foreground disabled:opacity-40">
                  <Globe className="size-4" aria-hidden="true" /> <span className="sm:hidden">PUBLICAR</span><span className="hidden sm:inline">PUBLICAR CAMBIOS</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
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

      {confirmPublish && tapList && !isPublished && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-label="Confirmar publicación">
          <div className="w-full max-w-md border border-foreground/20 bg-background p-6">
            <h2 className="display-tight text-2xl">¿Publicar cambios?</h2>
            <p className="mt-3 text-sm text-muted-foreground">Esta versión reemplazará el tap list público de {activeLocation?.name}.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmPublish(false)} className="min-h-11 flex-1 border border-foreground/20">CANCELAR</button>
              <button onClick={handlePublishToggle} disabled={isPending} className="min-h-11 flex-1 bg-accent text-accent-foreground">{isPending ? 'PUBLICANDO…' : 'PUBLICAR'}</button>
            </div>
          </div>
        </div>
      )}
      {message && <div role="status" className="fixed right-4 bottom-20 z-[70] max-w-sm border border-foreground/20 bg-background px-4 py-3 text-sm shadow-xl xl:bottom-4">{message}</div>}
    </>
  )
}
