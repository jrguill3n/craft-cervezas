'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus, Trash2, X } from 'lucide-react'
import type { BeerRow } from '@/lib/db-types'
import { createBeer, deleteBeer, updateBeer } from '@/app/admin/actions'

type Props = { beers: BeerRow[] }

type FormState = {
  name: string
  brewery: string
  style: string
  abv: string
  price: string
  description: string
}

const EMPTY: FormState = { name: '', brewery: '', style: '', abv: '', price: '', description: '' }

function beerToForm(b: BeerRow): FormState {
  return {
    name: b.name,
    brewery: b.brewery,
    style: b.style,
    abv: String(b.abv),
    price: b.primary_price == null ? '' : String(b.primary_price),
    description: b.description ?? '',
  }
}

export function BeersEditor({ beers }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<BeerRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<BeerRow | null>(null)

  function startCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError(null)
    setCreating(true)
  }

  function startEdit(beer: BeerRow) {
    setCreating(false)
    setForm(beerToForm(beer))
    setError(null)
    setEditing(beer)
  }

  function cancel() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  function handleField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function buildFormData() {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))
    return fd
  }

  function handleSave() {
    if (!form.name.trim() || !form.brewery.trim() || !form.style.trim() || form.abv === '') {
      setError('Nombre, cervecería, estilo y ABV son obligatorios.')
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setError('El precio debe ser mayor a cero.')
      return
    }
    if (!Number.isFinite(Number(form.abv)) || Number(form.abv) < 0 || Number(form.abv) > 100) {
      setError('El ABV debe estar entre 0 y 100.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (editing) {
          await updateBeer(editing.id, buildFormData())
        } else {
          await createBeer(buildFormData())
        }
        cancel()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteBeer(id)
        setDeleteCandidate(null)
        router.refresh()
      } catch {
        setError('No se puede eliminar: la cerveza está en uso en una tap list.')
      }
    })
  }

  const showForm = creating || editing !== null

  useEffect(() => {
    if (!showForm) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showForm])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-8 md:items-center">
        <div>
          <p className="label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
          <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Cervezas</h1>
          <p className="mt-2 text-xs text-muted-foreground">{beers.length} en el catálogo</p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-foreground px-4 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 md:px-5"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="md:hidden">NUEVA</span>
            <span className="hidden md:inline">NUEVA CERVEZA</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background md:static md:mb-8 md:block md:h-auto md:max-h-none md:border md:border-foreground/20 md:p-6">
          <div className="relative z-10 flex min-h-16 shrink-0 items-center justify-between border-b border-foreground/15 bg-background px-4 pt-[env(safe-area-inset-top)] md:static md:mb-5 md:min-h-0 md:border-0 md:p-0">
            <div>
              <p className="label-xs text-muted-foreground md:hidden">CATÁLOGO</p>
              <h2 className="mt-1 text-base font-bold tracking-widest text-foreground md:mt-0 md:text-sm">
                {editing ? 'EDITAR CERVEZA' : 'NUEVA CERVEZA'}
              </h2>
            </div>
            <button onClick={cancel} className="inline-flex size-11 items-center justify-center border border-foreground/15 md:hidden" aria-label="Cerrar formulario">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [-webkit-overflow-scrolling:touch] md:overflow-visible md:p-0">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {(
              [
                ['name', 'NOMBRE', 'text', 'Ej. Hazy Jalisco'],
                ['brewery', 'CERVECERÍA', 'text', 'Ej. Craft'],
                ['style', 'ESTILO', 'text', 'Ej. New England IPA'],
                ['abv', 'ABV (%)', 'number', '5.5'],
              ] as [keyof FormState, string, string, string][]
            ).map(([field, label, type, placeholder]) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="label-xs text-foreground/60">{label}</label>
                <input
                  type={type}
                  inputMode={type === 'number' ? 'decimal' : undefined}
                  step={type === 'number' ? '0.1' : undefined}
                  min={type === 'number' ? '0' : undefined}
                  value={form[field]}
                  onChange={(e) => handleField(field, e.target.value)}
                  placeholder={placeholder}
                className="min-h-12 border border-foreground/20 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                />
              </div>
            ))}

            {/* Price field with $ prefix */}
            <div className="flex flex-col gap-1">
              <label htmlFor="beer-price" className="label-xs text-foreground/60">
                PRECIO (MXN)
              </label>
              <div className="flex min-h-12 items-center border border-foreground/20 focus-within:border-foreground md:min-h-11">
                <span className="self-stretch border-r border-foreground/20 px-4 py-3 text-base text-foreground/40 md:py-2.5 md:text-sm">
                  $
                </span>
                <input
                  id="beer-price"
                  type="text"
                  inputMode="decimal"
                  required
                  value={form.price}
                  onChange={(e) => handleField('price', e.target.value)}
                  placeholder="95.00"
                  className="min-w-0 flex-1 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:outline-none md:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-1 md:mt-4">
            <label className="label-xs text-foreground/60">DESCRIPCIÓN (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              rows={2}
              placeholder="Notas de cata, maridajes…"
              className="resize-none border border-foreground/20 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:text-sm"
            />
          </div>

          {error && <p className="mt-3 text-xs text-accent" role="alert">{error}</p>}

          </div>
          <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-foreground/15 bg-background p-4 md:static md:mt-5 md:border-0 md:p-0">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="min-h-12 flex-1 bg-foreground px-5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-40 md:min-h-11 md:flex-none"
            >
              {isPending ? 'GUARDANDO…' : editing ? 'ACTUALIZAR' : 'CREAR'}
            </button>
            <button
              onClick={cancel}
              className="min-h-12 flex-1 border border-foreground/15 px-5 text-xs tracking-widest text-foreground/50 hover:text-foreground md:min-h-11 md:flex-none md:border-0"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* Mobile catalogue */}
      <div className="divide-y divide-foreground/10 border-y border-foreground/10 xl:hidden">
        {beers.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-base font-semibold">El catálogo está vacío</p>
            <p className="mt-2 text-sm text-muted-foreground">Crea la primera cerveza para agregarla a un tap.</p>
          </div>
        )}
        {beers.map((beer) => (
          <article key={beer.id} className="flex min-h-[5.75rem] items-center gap-3 py-3">
            <button onClick={() => startEdit(beer)} className="min-w-0 flex-1 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="truncate text-base font-semibold">{beer.name}</h2>
                <span className="shrink-0 font-mono text-sm font-semibold text-accent">
                  {beer.primary_price == null ? '—' : `$${Number(beer.primary_price).toFixed(0)}`}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{beer.brewery} · {beer.style}</p>
              <p className="mt-1 text-xs text-foreground/45">{beer.abv}% ABV · MXN</p>
            </button>
            <button onClick={() => {
              setError(null)
              setDeleteCandidate(beer)
            }} className="inline-flex size-11 shrink-0 items-center justify-center text-foreground/35 hover:text-accent" aria-label={`Eliminar ${beer.name}`}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
            <button onClick={() => startEdit(beer)} className="inline-flex size-11 shrink-0 items-center justify-center border border-foreground/15" aria-label={`Editar ${beer.name}`}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
      <div className="hidden overflow-auto xl:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              {['NOMBRE', 'CERVECERÍA', 'ESTILO', 'ABV', 'PRECIO', ''].map((h) => (
                <th key={h} className="label-xs pb-3 pr-6 text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
              {beers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Sin cervezas. Crea la primera.
                </td>
              </tr>
            )}
            {beers.map((b) => (
              <tr key={b.id} className="group">
                <td className="py-3 pr-6 font-semibold text-foreground">{b.name}</td>
                <td className="py-3 pr-6 text-xs text-foreground/70">{b.brewery}</td>
                <td className="py-3 pr-6 text-xs text-foreground/70">{b.style}</td>
                <td className="py-3 pr-6 font-mono text-xs text-foreground/70">{b.abv}%</td>
                <td className="py-3 pr-6 font-mono text-xs font-semibold text-foreground">
                  {b.primary_price == null ? 'PENDIENTE' : `$${Number(b.primary_price).toFixed(0)}`}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-xs tracking-widest text-foreground/50 hover:text-foreground"
                    >
                      EDITAR
                    </button>
                    <button
                      onClick={() => {
                        setError(null)
                        setDeleteCandidate(b)
                      }}
                      disabled={isPending}
                      className="text-xs tracking-widest text-foreground/30 hover:text-accent disabled:opacity-30"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
          <div className="w-full max-w-md border border-foreground/20 bg-background p-6">
            <h2 className="text-xl font-semibold">¿Eliminar {deleteCandidate.name}?</h2>
            <p className="mt-3 text-sm text-muted-foreground">No podrá eliminarse si está en uso en un tap list.</p>
            {error && <p className="mt-4 text-xs text-accent" role="alert">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => {
                setDeleteCandidate(null)
                setError(null)
              }} className="min-h-11 flex-1 border border-foreground/20">CANCELAR</button>
              <button onClick={() => handleDelete(deleteCandidate.id)} disabled={isPending} className="min-h-11 flex-1 bg-accent text-accent-foreground">ELIMINAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
