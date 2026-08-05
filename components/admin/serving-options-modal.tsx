'use client'

import { useState, useTransition } from 'react'
import type { TapListItemFull } from '@/lib/db-types'
import { upsertServingOptions } from '@/app/admin/actions'

type ServingRow = {
  id?: string
  label: string
  size: string
  price: string // string for input control, coerced on save
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
      if (!r.label || !r.size || r.price === '') {
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
      } catch (err) {
        setError('Error al guardar. Intenta de nuevo.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg border border-foreground/20 bg-background p-8 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest text-foreground">OPCIONES DE SERVICIO</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground">×</button>
        </div>
        <p className="mb-6 text-xs text-muted-foreground">
          {item.beers.name} · {item.beers.brewery}
        </p>

        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            {['ETIQUETA', 'TAMAÑO', 'PRECIO (MXN)', ''].map((h) => (
              <span key={h} className="label-xs text-muted-foreground">{h}</span>
            ))}
          </div>

          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <input
                value={row.label}
                onChange={(e) => updateRow(i, 'label', e.target.value)}
                placeholder="Pinta"
                className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              />
              <input
                value={row.size}
                onChange={(e) => updateRow(i, 'size', e.target.value)}
                placeholder="473 ml"
                className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              />
              <input
                type="number"
                min="0"
                step="0.5"
                value={row.price}
                onChange={(e) => updateRow(i, 'price', e.target.value)}
                placeholder="85"
                className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-foreground/30 transition-colors hover:text-accent"
                aria-label="Eliminar opción"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="mt-1 text-left text-xs font-semibold tracking-widest text-accent hover:underline"
          >
            + AGREGAR OPCIÓN
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-accent" role="alert">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs tracking-widest text-foreground/50 hover:text-foreground"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
          >
            {isPending ? 'GUARDANDO…' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
