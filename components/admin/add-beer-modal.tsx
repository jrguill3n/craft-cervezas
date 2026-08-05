'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import type { BeerRow } from '@/lib/db-types'

type Props = {
  beers: BeerRow[]
  onAdd: (beerId: string, tapNumber: string, badge: string, defaultPrice: string) => void
  onClose: () => void
}

const BADGE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'new', label: 'NUEVO' },
  { value: 'limited', label: 'LIMITADO' },
  { value: 'guest', label: 'INVITADO' },
  { value: 'house', label: 'CASA' },
]

export function AddBeerModal({ beers, onAdd, onClose }: Props) {
  const [beerId, setBeerId] = useState('')
  const [tapNumber, setTapNumber] = useState('')
  const [badge, setBadge] = useState('')
  const [defaultPrice, setDefaultPrice] = useState('')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search on mount, close on Escape
  useEffect(() => {
    searchRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = beers.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.brewery.toLowerCase().includes(query.toLowerCase()) ||
      b.style.toLowerCase().includes(query.toLowerCase()),
  )

  const selected = beers.find((b) => b.id === beerId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!beerId) return
    onAdd(beerId, tapNumber, badge, defaultPrice)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Agregar cerveza"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-foreground/15 bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/15 px-6 py-5">
          <div>
            <p className="label-xs text-muted-foreground">NUEVA ENTRADA</p>
            <h2 className="display-tight mt-0.5 text-2xl">Agregar</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-8 items-center justify-center text-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          {/* Search */}
          <div className="relative border-b border-foreground/10 px-6 py-4">
            <Search className="absolute left-9 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar por nombre, cervecería…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-foreground/15 bg-transparent py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
            />
          </div>

          {/* Beer list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              filtered.map((b) => {
                const isSelected = beerId === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBeerId(b.id)}
                    className={`flex w-full items-center justify-between border-b border-foreground/5 px-6 py-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-foreground text-background'
                        : 'hover:bg-foreground/5'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold leading-tight">{b.name}</span>
                      <span className={`mt-0.5 block text-xs ${isSelected ? 'text-background/60' : 'text-muted-foreground'}`}>
                        {b.brewery} · {b.style}
                      </span>
                    </span>
                    <span className={`ml-4 shrink-0 font-mono text-xs ${isSelected ? 'text-background/60' : 'text-muted-foreground'}`}>
                      {b.abv}%
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Bottom controls */}
          <div className="border-t border-foreground/15 px-6 py-5">
            {selected && (
              <p className="mb-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{selected.name}</span>
                {' '}&mdash; {selected.brewery}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label-xs text-foreground/50">TAP #</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="99"
                  value={tapNumber}
                  onChange={(e) => setTapNumber(e.target.value)}
                  placeholder="Ej. 3"
                  className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-xs text-foreground/50">BADGE</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                >
                  {BADGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price — creates default "Vaso" serving option automatically */}
            <div className="mt-3 flex flex-col gap-1.5">
              <label htmlFor="drawer-price" className="label-xs text-foreground/50">
                PRECIO MXN (opcional — crea opción &quot;Vaso&quot; automáticamente)
              </label>
              <div className="flex items-center border border-foreground/20 focus-within:border-foreground">
                <span className="select-none border-r border-foreground/20 px-3 py-2 text-sm text-foreground/40">
                  $
                </span>
                <input
                  id="drawer-price"
                  type="text"
                  inputMode="decimal"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="95.00"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!beerId}
              className="mt-4 w-full bg-accent py-3 text-xs font-semibold tracking-widest text-accent-foreground transition-colors hover:bg-accent/85 disabled:opacity-30"
            >
              AGREGAR A LA LISTA
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
