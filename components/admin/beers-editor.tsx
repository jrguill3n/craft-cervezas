'use client'

import { useState, useTransition } from 'react'
import type { BeerRow } from '@/lib/db-types'
import { createBeer, deleteBeer, updateBeer } from '@/app/admin/actions'

type Props = { beers: BeerRow[] }

type FormState = {
  name: string
  brewery: string
  style: string
  abv: string
  ibu: string
  description: string
}

const EMPTY: FormState = { name: '', brewery: '', style: '', abv: '', ibu: '', description: '' }

function beerToForm(b: BeerRow): FormState {
  return {
    name: b.name,
    brewery: b.brewery,
    style: b.style,
    abv: String(b.abv),
    ibu: b.ibu != null ? String(b.ibu) : '',
    description: b.description ?? '',
  }
}

export function BeersEditor({ beers }: Props) {
  const [editing, setEditing] = useState<BeerRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
    if (!form.name || !form.brewery || !form.style || !form.abv) {
      setError('Nombre, cervecería, estilo y ABV son obligatorios.')
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
      } catch (err) {
        setError('Error al guardar. Intenta de nuevo.')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cerveza? No se puede deshacer si está en una tap list activa.')) return
    startTransition(async () => {
      try {
        await deleteBeer(id)
      } catch {
        setError('No se puede eliminar: la cerveza está en uso en una tap list.')
      }
    })
  }

  const showForm = creating || editing !== null

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Cervezas</h1>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="bg-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80"
          >
            + NUEVA CERVEZA
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 border border-foreground/20 p-6">
          <h2 className="mb-5 text-sm font-bold tracking-widest text-foreground">
            {editing ? 'EDITAR CERVEZA' : 'NUEVA CERVEZA'}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {(
              [
                ['name', 'NOMBRE', 'text', 'Ej. Hazy Jalisco'],
                ['brewery', 'CERVECERÍA', 'text', 'Ej. Craft'],
                ['style', 'ESTILO', 'text', 'Ej. New England IPA'],
                ['abv', 'ABV (%)', 'number', '5.5'],
                ['ibu', 'IBU (opcional)', 'number', '45'],
              ] as [keyof FormState, string, string, string][]
            ).map(([field, label, type, placeholder]) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="label-xs text-foreground/60">{label}</label>
                <input
                  type={type}
                  step={type === 'number' ? '0.1' : undefined}
                  min={type === 'number' ? '0' : undefined}
                  value={form[field]}
                  onChange={(e) => handleField(field, e.target.value)}
                  placeholder={placeholder}
                  className="border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <label className="label-xs text-foreground/60">DESCRIPCIÓN (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              rows={2}
              placeholder="Notas de cata, maridajes…"
              className="resize-none border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
            />
          </div>

          {error && <p className="mt-3 text-xs text-accent" role="alert">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="bg-foreground px-5 py-2.5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
            >
              {isPending ? 'GUARDANDO…' : editing ? 'ACTUALIZAR' : 'CREAR'}
            </button>
            <button
              onClick={cancel}
              className="px-5 py-2.5 text-xs tracking-widest text-foreground/50 hover:text-foreground"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              {['NOMBRE', 'CERVECERÍA', 'ESTILO', 'ABV', 'IBU', ''].map((h) => (
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
                <td className="py-3 pr-6 font-mono text-xs text-foreground/50">{b.ibu ?? '—'}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-xs tracking-widest text-foreground/50 hover:text-foreground"
                    >
                      EDITAR
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
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
    </div>
  )
}
