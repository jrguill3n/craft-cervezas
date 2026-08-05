'use client'

import { useState } from 'react'
import type { BeerRow } from '@/lib/db-types'

type Props = {
  beers: BeerRow[]
  onAdd: (beerId: string, tapNumber: string, badge: string) => void
  onClose: () => void
}

export function AddBeerModal({ beers, onAdd, onClose }: Props) {
  const [beerId, setBeerId] = useState('')
  const [tapNumber, setTapNumber] = useState('')
  const [badge, setBadge] = useState('')
  const [query, setQuery] = useState('')

  const filtered = beers.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.brewery.toLowerCase().includes(query.toLowerCase()),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!beerId) return
    onAdd(beerId, tapNumber, badge)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md border border-foreground/20 bg-background p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest text-foreground">AGREGAR CERVEZA</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar cerveza…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
          />

          {/* Beer list */}
          <div className="max-h-48 overflow-y-auto border border-foreground/10">
            {filtered.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">Sin resultados.</p>
            )}
            {filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBeerId(b.id)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  beerId === b.id ? 'bg-foreground text-background' : 'hover:bg-foreground/5'
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">{b.name}</span>
                  <span className={`text-xs ${beerId === b.id ? 'text-background/70' : 'text-muted-foreground'}`}>
                    {b.brewery} · {b.style}
                  </span>
                </span>
                <span className={`font-mono text-xs ${beerId === b.id ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {b.abv}%
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-xs text-foreground/60">TAP #</label>
              <input
                type="number"
                min="1"
                value={tapNumber}
                onChange={(e) => setTapNumber(e.target.value)}
                placeholder="Ej. 3"
                className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-xs text-foreground/60">BADGE</label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
              >
                <option value="">—</option>
                <option value="new">NUEVO</option>
                <option value="limited">LIMITADO</option>
                <option value="guest">INVITADO</option>
                <option value="house">CASA</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!beerId}
            className="mt-2 bg-foreground py-3 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-30"
          >
            AGREGAR A LA LISTA
          </button>
        </form>
      </div>
    </div>
  )
}
