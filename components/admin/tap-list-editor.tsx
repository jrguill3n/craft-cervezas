'use client'

import { useState, useTransition, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Save, Pencil, ChevronDown, GripVertical } from 'lucide-react'
import type { BeerRow, LocationRow, ProfileRow, TapListFull, TapListItemFull } from '@/lib/db-types'
import { compareTapListItems } from '@/lib/tap-list-order'
import { saveAndPublishTapList } from '@/app/admin/actions'
import { AddBeerModal } from './add-beer-modal'

type Props = {
  locations: LocationRow[]
  tapLists: TapListFull[]
  allBeers: BeerRow[]
  profile: ProfileRow
  initialLocationId: string
}

export function TapListEditor({ locations, tapLists, allBeers, profile, initialLocationId }: Props) {
  const router = useRouter()
  const [activeLocationId, setActiveLocationId] = useState(initialLocationId)
  const [isPending, startTransition] = useTransition()
  const [showAddBeer, setShowAddBeer] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [editedItems, setEditedItems] = useState<TapListItemFull[]>([])
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)

  const activeLocation = locations.find((l) => l.id === activeLocationId)
  const tapList = tapLists.find((t) => t.location_id === activeLocationId) ?? null
  const isEditing = editingLocationId === activeLocationId
  const items: TapListItemFull[] = (isEditing ? editedItems : (tapList?.tap_list_items ?? [])).slice().sort(compareTapListItems)

  function handleLocationChange(locationId: string) {
    const location = locations.find((candidate) => candidate.id === locationId)
    if (!location) return
    setActiveLocationId(locationId)
    router.replace(`/admin?location=${encodeURIComponent(location.slug)}`, { scroll: false })
  }

  function renumber(nextItems: TapListItemFull[]) {
    return nextItems.map((item, index) => ({
      ...item,
      tap_number: index + 1,
      display_order: index,
    }))
  }

  function handleEdit() {
    setEditedItems(renumber((tapList?.tap_list_items ?? []).slice().sort(compareTapListItems).map((item) => ({
      ...item,
      serving_options: item.serving_options.map((option) => ({ ...option })),
    }))))
    setEditingLocationId(activeLocationId)
    setMessage(null)
  }

  function handleCancel() {
    setEditingLocationId(null)
    setEditedItems([])
    setShowAddBeer(false)
  }

  function handleSave() {
    const tapNumbers = items.map((item) => item.tap_number).filter((value): value is number => value !== null)
    if (new Set(tapNumbers).size !== tapNumbers.length) {
      setMessage('No puede haber dos cervezas con el mismo número de tap.')
      return
    }
    if (items.some((item) => item.serving_options.length === 0)) {
      setMessage('Todas las cervezas deben tener al menos un precio.')
      return
    }
    if (items.some((item) => Number(item.serving_options[0]?.price) <= 0)) {
      setMessage('Todos los precios deben ser mayores a cero.')
      return
    }
    startTransition(async () => {
      try {
        await saveAndPublishTapList(activeLocationId, items.map((item) => ({
          beer_id: item.beer_id,
          tap_number: item.tap_number,
          badge: item.badge,
        })))
        setEditingLocationId(null)
        setEditedItems([])
        setMessage('Cambios guardados y publicados.')
        router.refresh()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo guardar el tap list.')
      }
    })
  }

  function handleAddBeer(beerId: string) {
    if (editedItems.some((item) => item.beer_id === beerId)) {
      setMessage('Esa cerveza ya está en el tap list.')
      return false
    }
    const beer = allBeers.find((candidate) => candidate.id === beerId)
    if (!beer) {
      setMessage('No se encontró la cerveza seleccionada.')
      return false
    }
    if (beer.primary_price == null || Number(beer.primary_price) <= 0) {
      setMessage('Esta cerveza necesita un precio válido en el catálogo de Cervezas.')
      return false
    }
    const localId = `local-item-${crypto.randomUUID()}`
    setEditedItems((current) => renumber([...current, {
      id: localId,
      tap_list_id: tapList?.id ?? 'local-list',
      beer_id: beer.id,
      tap_number: current.length + 1,
      badge: null,
      display_order: current.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      beers: beer,
      serving_options: [{
        id: `local-option-${localId}`,
        beer_id: beer.id,
        label: 'Pinta',
        size: 'Pinta',
        price: Number(beer.primary_price),
        display_order: 1,
      }],
    }]))
    setMessage(null)
    return true
  }

  function handleRemoveItem(itemId: string) {
    setEditedItems((current) => renumber(current.filter((item) => item.id !== itemId)))
  }

  function moveItem(itemId: string, targetItemId: string) {
    if (itemId === targetItemId) return
    setEditedItems((current) => {
      const ordered = current.slice().sort(compareTapListItems)
      const from = ordered.findIndex((item) => item.id === itemId)
      const to = ordered.findIndex((item) => item.id === targetItemId)
      if (from < 0 || to < 0 || from === to) return current
      const [moved] = ordered.splice(from, 1)
      ordered.splice(to, 0, moved)
      return renumber(ordered)
    })
  }

  function moveItemBy(itemId: string, delta: number) {
    const index = items.findIndex((item) => item.id === itemId)
    const target = items[index + delta]
    if (!target) return
    moveItem(itemId, target.id)
    setMessage(`Tap ${index + 1} movido a la posición ${index + delta + 1}.`)
  }

  function handleDragStart(event: ReactPointerEvent<HTMLButtonElement>, itemId: string) {
    if (!isEditing || isPending) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingItemId(itemId)
  }

  function handleDragMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingItemId) return
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-reorder-id]')
    const targetId = target?.dataset.reorderId
    if (targetId) moveItem(draggingItemId, targetId)
  }

  function handleDragEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDraggingItemId(null)
  }

  function renderReorderHandle(item: TapListItemFull) {
    if (!isEditing) return null
    return (
      <button
        type="button"
        aria-label={`Mover ${item.beers.name}. Usa las flechas arriba y abajo o arrastra.`}
        onPointerDown={(event) => handleDragStart(event, item.id)}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') { event.preventDefault(); moveItemBy(item.id, -1) }
          if (event.key === 'ArrowDown') { event.preventDefault(); moveItemBy(item.id, 1) }
        }}
        className={`inline-flex size-11 touch-none items-center justify-center border border-foreground/15 text-accent active:cursor-grabbing ${draggingItemId === item.id ? 'bg-accent text-accent-foreground' : 'cursor-grab'}`}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <>
      <div className={`flex h-full flex-col transition-opacity ${isPending ? 'opacity-60' : ''}`}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 px-4 pt-5 pb-4 md:items-center md:px-6 md:pt-8 md:pb-6 xl:px-8">
          <div className="min-w-0">
            <p className="label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
            <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Tap List</h1>
            <p className="mt-2 hidden text-xs text-muted-foreground md:block">{items.length} cerveza{items.length !== 1 ? 's' : ''}</p>
            {isEditing && <p className="mt-1 hidden text-xs font-semibold text-accent sm:block">ARRASTRA ⠿ PARA CAMBIAR EL ORDEN Y EL NÚMERO DE TAP</p>}
          </div>

          {!isEditing && (
            <button onClick={handleEdit} disabled={isPending} className="hidden min-h-11 shrink-0 items-center gap-2 border border-foreground/25 px-4 text-xs font-semibold tracking-widest md:inline-flex">
              <Pencil className="size-4" aria-hidden="true" /> EDITAR
            </button>
          )}
        </div>

        {/* ── Location tabs ─────────────────────────────────────────────────── */}
        <div className="border-y border-foreground/15 px-4 py-2 md:hidden">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="relative">
                <select
                  id="admin-location"
                  aria-label="Sucursal que se está editando"
                  value={activeLocationId}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  disabled={isEditing || isPending}
                  className={`min-h-12 w-full appearance-none border bg-background px-4 pr-12 text-base font-semibold tracking-wide focus:outline-none ${isEditing ? 'border-accent/50 text-accent' : 'border-foreground/25 text-foreground focus:border-accent'}`}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}{isEditing && loc.id === activeLocationId ? ' — Editando' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-accent" aria-hidden="true" />
              </div>
              <p className="mt-2 px-1 text-xs text-muted-foreground">
                {items.length} cerveza{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!isEditing && (
              <button onClick={handleEdit} disabled={isPending} className="inline-flex min-h-12 shrink-0 items-center gap-2 border border-foreground/25 px-3 text-[0.65rem] font-semibold tracking-widest">
                <Pencil className="size-4" aria-hidden="true" /> EDITAR
              </button>
            )}
          </div>
        </div>
        <div className="hidden overflow-x-auto border-b border-foreground/15 px-2 md:flex md:px-4 xl:px-8">
          {locations.map((loc) => {
            const tl = tapLists.find((t) => t.location_id === loc.id)
            const isActive = loc.id === activeLocationId
            return (
              <button
                key={loc.id}
                onClick={() => handleLocationChange(loc.id)}
                disabled={isEditing || isPending}
                className={`relative min-h-11 shrink-0 px-4 py-3 text-[0.65rem] font-semibold tracking-widest transition-colors ${
                  isActive
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                    : 'text-foreground/40 hover:text-foreground/70'
                }`}
              >
                {loc.name.toUpperCase()}{isEditing && isActive ? ' · EDITANDO' : ''}
                {tl && (
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
              onClick={handleEdit}
              disabled={isPending}
              className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              CREAR TAP LIST
            </button>
          </div>
        )}

        {/* ── Items table ───────────────────────────────────────────────────── */}
        {(tapList || isEditing) && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              <div className="divide-y divide-foreground/10 px-4 xl:hidden">
                {items.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Sin cervezas. Agrega la primera.</p>}
                {items.map((item) => (
                  <article key={item.id} data-reorder-id={item.id} className={`py-3.5 transition-colors ${draggingItemId === item.id ? 'bg-accent/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      {renderReorderHandle(item)}
                      <span className="display-tight w-9 shrink-0 text-center text-2xl text-accent">{item.tap_number ?? '—'}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold">{item.beers.name}</h3>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{item.beers.brewery} · {item.beers.style} · {item.beers.abv}%</p>
                      </div>
                      <span className="w-28 shrink-0 text-right font-mono text-sm font-semibold text-foreground">
                        {item.serving_options[0]?.price == null ? 'PENDIENTE' : `$${Number(item.serving_options[0].price).toFixed(0)}`}
                      </span>
                      {isEditing && (
                        <button onClick={() => handleRemoveItem(item.id)} disabled={isPending} className="inline-flex size-11 shrink-0 items-center justify-center text-foreground/40 transition-colors active:text-accent disabled:opacity-30" aria-label={`Quitar ${item.beers.name}`}><X className="size-4" aria-hidden="true" /></button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <table className="hidden w-full text-sm xl:table">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-foreground/15">
                    <th className="label-xs w-12 px-8 py-3 text-left text-muted-foreground">TAP</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">CERVEZA</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">ESTILO</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">ABV</th>
                    <th className="label-xs px-3 py-3 text-left text-muted-foreground">PRECIO</th>
                    <th className="w-16 px-3 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-14 text-center text-sm text-muted-foreground">
                        Sin cervezas. Usa el botón de abajo para agregar la primera.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id} data-reorder-id={item.id} className={`group transition-colors hover:bg-foreground/3 ${draggingItemId === item.id ? 'bg-accent/10' : ''}`}>
                      {/* Tap number */}
                      <td className="px-8 py-4 font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {renderReorderHandle(item)}
                          <span>{item.tap_number != null ? String(item.tap_number).padStart(2, '0') : '—'}</span>
                        </div>
                      </td>

                      {/* Beer name + brewery */}
                      <td className="px-3 py-4">
                        <p className="font-semibold leading-tight text-foreground">{item.beers.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.beers.brewery}</p>
                      </td>

                      {/* Style */}
                      <td className="px-3 py-4 text-xs text-foreground/60">
                        {item.beers.style}
                      </td>

                      {/* ABV */}
                      <td className="px-3 py-4 font-mono text-xs text-foreground/60">
                        {item.beers.abv}%
                      </td>

                      {/* Catalogue price — read only */}
                      <td className="px-3 py-4">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {item.serving_options[0]?.price == null ? 'PENDIENTE' : `$${Number(item.serving_options[0].price).toFixed(0)}`}
                        </span>
                      </td>

                      {/* Remove action */}
                      <td className="px-3 py-4">
                        <div className="flex justify-end">
                          <button onClick={() => handleRemoveItem(item.id)} disabled={isPending || !isEditing} aria-label={`Eliminar ${item.beers.name}`} className="inline-flex size-11 shrink-0 items-center justify-center text-foreground/40 transition-colors hover:text-accent disabled:opacity-30"><X className="size-4" aria-hidden="true" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Footer row ──────────────────────────────────────────────── */}
            <div className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-t border-foreground/15 bg-background px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,.22)] md:px-6 md:py-3 md:shadow-none xl:px-8 xl:py-4">
              <button
                onClick={() => setShowAddBeer(true)}
                disabled={isPending || !isEditing}
                className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-widest text-accent transition-colors hover:text-accent/70 disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span className="sm:hidden">AGREGAR</span><span className="hidden sm:inline">AGREGAR CERVEZA</span>
              </button>
              <span className="label-xs hidden text-muted-foreground md:inline">
                {items.length} cerveza{items.length !== 1 ? 's' : ''}
                {tapList?.published_at ? (
                  <> · Publicado {new Date(tapList.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</>
                ) : null}
              </span>
              {isEditing && (
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={isPending} className="min-h-11 border border-foreground/20 px-3 text-xs font-semibold tracking-widest disabled:opacity-40">CANCELAR</button>
                  <button onClick={handleSave} disabled={isPending} className="inline-flex min-h-11 items-center gap-2 bg-accent px-4 text-xs font-semibold tracking-widest text-accent-foreground disabled:opacity-40">
                    <Save className="size-4" aria-hidden="true" /> {isPending ? 'GUARDANDO…' : 'GUARDAR Y PUBLICAR'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showAddBeer && isEditing && (
        <AddBeerModal
          beers={allBeers}
          onAdd={handleAddBeer}
          onClose={() => setShowAddBeer(false)}
        />
      )}

      {message && <div role="status" className="fixed right-4 bottom-20 z-[70] max-w-sm border border-foreground/20 bg-background px-4 py-3 text-sm shadow-xl xl:bottom-4">{message}</div>}
    </>
  )
}
