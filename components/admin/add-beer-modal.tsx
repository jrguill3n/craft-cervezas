'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import type { BeerRow } from '@/lib/db-types'
import { useModalScrollLock } from './use-modal-scroll-lock'

type Props = {
  beers: BeerRow[]
  onAdd: (beerId: string, tapNumber: string, badge: string, price: string) => boolean
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
  const [price, setPrice] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useModalScrollLock()

  // Avoid opening the mobile keyboard as the drawer mounts; that changes the
  // visual viewport and makes the entire panel appear to jump.
  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      searchRef.current?.focus()
    }
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
    setError(null)
    if (!beerId || !price || Number(price) <= 0) {
      setError('Selecciona una cerveza y captura un precio válido.')
      return
    }
    if (tapNumber) {
      const parsedTapNumber = Number(tapNumber)
      if (!Number.isInteger(parsedTapNumber) || parsedTapNumber < 1 || parsedTapNumber > 99) {
        setError('El número de tap debe ser entero entre 1 y 99.')
        return
      }
    }
    if (onAdd(beerId, tapNumber, badge, price)) {
      onClose()
    }
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
        className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden overscroll-none bg-background shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:h-auto md:max-h-none md:max-w-xl md:border-l md:border-foreground/15"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-foreground/15 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:py-5">
          <div>
            <p className="label-xs text-muted-foreground">NUEVA ENTRADA</p>
            <h2 className="display-tight mt-0.5 text-2xl">Agregar</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center text-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Search */}
          <div className="relative shrink-0 border-b border-foreground/10 px-4 py-3 md:px-6 md:py-4">
            <Search className="absolute left-7 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground md:left-9" aria-hidden="true" />
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            {filtered.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              filtered.map((b) => {
                const isSelected = beerId === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBeerId(b.id)
                      setPrice(b.primary_price == null ? '' : String(b.primary_price))
                    }}
                    className={`flex min-h-14 w-full items-center justify-between border-b border-foreground/5 px-6 py-3.5 text-left transition-colors ${
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
                    <span className={`ml-4 shrink-0 text-right font-mono text-xs ${isSelected ? 'text-background/60' : 'text-muted-foreground'}`}>
                      <span className="block">{b.abv}%</span>
                      <span className="mt-1 block font-semibold">
                        {b.primary_price == null ? 'SIN PRECIO' : `$${Number(b.primary_price).toFixed(0)}`}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Bottom controls */}
          <div className="shrink-0 border-t border-foreground/15 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:py-5">
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
              <div className="flex flex-col gap-2">
                <label className="label-xs text-foreground/50">BADGE</label>
                <div className="relative">
                  <select value={badge} onChange={(e) => setBadge(e.target.value)} className="min-h-12 w-full appearance-none border border-foreground/25 bg-background px-3 pr-10 text-sm font-semibold text-foreground focus:border-accent focus:outline-none">
                    {BADGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-accent" aria-hidden="true" />
                </div>
              </div>
            </div>

            <label className="mt-3 block">
              <span className="label-xs text-foreground/50">PRECIO MXN · PINTA</span>
              <div className="mt-2 flex min-h-12 items-center border border-foreground/20 px-3 focus-within:border-accent">
                <span className="mr-1 text-foreground/40">$</span>
                <input type="number" inputMode="decimal" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="110.00" className="min-w-0 flex-1 bg-transparent text-base focus:outline-none" />
              </div>
            </label>

            {error && <p className="mt-3 text-xs text-accent" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={!beerId || !price || Number(price) <= 0}
              className="mt-4 min-h-12 w-full bg-accent py-3 text-xs font-semibold tracking-widest text-accent-foreground transition-colors hover:bg-accent/85 disabled:opacity-30"
            >
              AGREGAR A LA LISTA
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
