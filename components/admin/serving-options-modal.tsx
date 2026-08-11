'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { TapListItemFull } from '@/lib/db-types'
import { upsertServingOptions } from '@/app/admin/actions'

type ServingRow = {
  id?: string
  label: string
  size: string
  price: string
  display_order: number
}

type Props = {
  item: TapListItemFull
  onClose: () => void
}

function rowsFromItem(item: TapListItemFull): ServingRow[] {
  if (item.serving_options.length === 0) {
    return [{ label: '', size: '', price: '', display_order: 0 }]
  }
  return item.serving_options
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((o) => ({
      id: o.id,
      label: o.label,
      size: o.size,
      price: String(o.price),
      display_order: o.display_order,
    }))
}

export function ServingOptionsModal({ item, onClose }: Props) {
  const [rows, setRows] = useState<ServingRow[]>(() => rowsFromItem(item))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function addRow() {
    setRows((prev) => [
      ...prev,
      { label: '', size: '', price: '', display_order: prev.length },
    ])
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof ServingRow, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    )
  }

  function handleSave() {
    setError(null)
    for (const r of rows) {
      if (!r.label.trim() || !r.size.trim() || r.price === '') {
        setError('Completa todos los campos antes de guardar.')
        return
      }
      if (isNaN(Number(r.price)) || Number(r.price) < 0) {
        setError('El precio debe ser un número positivo.')
        return
      }
    }

    startTransition(async () => {
      try {
        await upsertServingOptions(
          item.id,
          rows.map((r, i) => ({
            id: r.id,
            label: r.label,
            size: r.size,
            price: Number(r.price),
            display_order: i,
          })),
        )
        onClose()
      } catch {
        setError('Error al guardar. Intenta de nuevo.')
      }
    })
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
        aria-label="Opciones de servicio"
        className="fixed inset-0 z-50 flex w-full flex-col bg-background shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-w-xl md:border-l md:border-foreground/15"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-foreground/15 px-6 py-5">
          <div>
            <p className="label-xs text-muted-foreground">PRECIOS</p>
            <h2 className="display-tight mt-0.5 text-2xl">{item.beers.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{item.beers.brewery}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-11 shrink-0 items-center justify-center text-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Column headers */}
          <div className="mb-2 hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 md:grid">
            {['ETIQUETA', 'TAMAÑO', 'PRECIO MXN', ''].map((h, i) => (
              <span key={i} className="label-xs text-muted-foreground">{h}</span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 items-center gap-2 border-b border-foreground/10 py-3 md:grid-cols-[1fr_1fr_1fr_auto] md:border-0 md:py-0">
                <input
                  value={row.label}
                  onChange={(e) => updateRow(i, 'label', e.target.value)}
                  placeholder="Pinta"
                  aria-label="Etiqueta"
                  className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none"
                />
                <input
                  value={row.size}
                  onChange={(e) => updateRow(i, 'size', e.target.value)}
                  placeholder="473 ml"
                  aria-label="Tamaño"
                  className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={row.price}
                  onChange={(e) => updateRow(i, 'price', e.target.value)}
                  placeholder="85"
                  aria-label="Precio"
                  className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Eliminar opción"
                  className="flex size-11 items-center justify-center text-foreground/50 transition-colors hover:text-accent"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-accent transition-colors hover:text-accent/70"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            AGREGAR OPCIÓN
          </button>

          {error && (
            <p className="mt-4 text-xs text-destructive" role="alert">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-foreground/15 px-6 py-5">
          <button
            onClick={onClose}
            className="flex-1 border border-foreground/20 py-3 text-xs font-semibold tracking-widest text-foreground/50 transition-colors hover:border-foreground hover:text-foreground"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 bg-accent py-3 text-xs font-semibold tracking-widest text-accent-foreground transition-colors hover:bg-accent/85 disabled:opacity-40"
          >
            {isPending ? 'GUARDANDO…' : 'GUARDAR'}
          </button>
        </div>
      </aside>
    </>
  )
}
