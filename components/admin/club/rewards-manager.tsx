'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, X } from 'lucide-react'
import { createReward, updateReward } from '@/app/admin/actions'
import type { RewardRow } from '@/lib/db-types'

type Props = {
  rewards: RewardRow[]
}

type FormState = {
  name: string
  description: string
  points_cost: string
  image_url: string
  stock_optional: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  points_cost: '',
  image_url: '',
  stock_optional: '',
  active: true,
}

function rewardToForm(reward: RewardRow): FormState {
  return {
    name: reward.name,
    description: reward.description ?? '',
    points_cost: String(reward.points_cost),
    image_url: reward.image_url ?? '',
    stock_optional: reward.stock_optional == null ? '' : String(reward.stock_optional),
    active: reward.active,
  }
}

export function RewardsManager({ rewards }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<RewardRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const showForm = creating || editing !== null

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(reward: RewardRow) {
    setCreating(false)
    setEditing(reward)
    setForm(rewardToForm(reward))
    setError(null)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function buildFormData() {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.set(key, String(value)))
    return formData
  }

  function handleSave() {
    if (!form.name.trim() || !form.points_cost.trim()) {
      setError('Nombre y costo en puntos son obligatorios.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        if (editing) {
          await updateReward(editing.id, buildFormData())
        } else {
          await createReward(buildFormData())
        }
        closeForm()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar la recompensa.')
      }
    })
  }

  useEffect(() => {
    if (!showForm) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showForm])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-8 md:items-center">
        <div>
          <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
          <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Recompensas</h1>
          <p className="mt-2 text-xs text-muted-foreground">{rewards.length} recompensa{rewards.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-foreground px-4 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 md:px-5"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="md:hidden">AGREGAR</span>
          <span className="hidden md:inline">AGREGAR RECOMPENSA</span>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rewards.length === 0 ? (
          <div className="border border-foreground/10 px-4 py-12 text-center md:col-span-2 xl:col-span-3">
            <p className="text-sm font-semibold">No hay recompensas todavía</p>
            <p className="mt-2 text-xs text-muted-foreground">Crea la primera recompensa temporal.</p>
          </div>
        ) : null}
        {rewards.map((reward) => (
          <article key={reward.id} className="border border-foreground/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{reward.name}</h2>
                <p className="mt-1 font-mono text-sm font-semibold text-accent">{reward.points_cost} pts</p>
              </div>
              <span className={`px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${
                reward.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-foreground/10 text-foreground/45'
              }`}>
                {reward.active ? 'activa' : 'inactiva'}
              </span>
            </div>
            {reward.description ? <p className="mt-3 text-sm text-muted-foreground">{reward.description}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
              <p className="text-xs text-foreground/45">
                Stock: {reward.stock_optional == null ? '—' : reward.stock_optional}
              </p>
              <button
                onClick={() => openEdit(reward)}
                className="inline-flex min-h-10 items-center gap-2 border border-foreground/15 px-3 text-xs font-semibold tracking-widest text-foreground/60 hover:text-foreground"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                EDITAR
              </button>
            </div>
          </article>
        ))}
      </div>

      {showForm ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background md:inset-0 md:grid md:place-items-center md:bg-background/80 md:p-6">
          <div className="flex min-h-0 w-full flex-1 flex-col bg-background md:max-w-3xl md:flex-none md:border md:border-foreground/20">
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-foreground/15 px-4 pt-[env(safe-area-inset-top)] md:px-6">
              <div>
                <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
                <h2 className="mt-1 text-base font-bold tracking-widest text-foreground">
                  {editing ? 'EDITAR RECOMPENSA' : 'AGREGAR RECOMPENSA'}
                </h2>
              </div>
              <button onClick={closeForm} className="inline-flex size-11 items-center justify-center border border-foreground/15" aria-label="Cerrar formulario">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="NOMBRE" required value={form.name} onChange={(value) => updateField('name', value)} placeholder="Craft Glass" />
                <Field label="COSTO EN PUNTOS" required value={form.points_cost} onChange={(value) => updateField('points_cost', value)} placeholder="100" inputMode="numeric" />
                <Field label="URL DE IMAGEN" value={form.image_url} onChange={(value) => updateField('image_url', value)} placeholder="/brand/..." />
                <Field label="STOCK" value={form.stock_optional} onChange={(value) => updateField('stock_optional', value)} placeholder="Opcional" inputMode="numeric" />
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="label-xs text-foreground/60">DESCRIPCIÓN</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    rows={4}
                    className="border border-foreground/20 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:text-sm"
                  />
                </label>
                <label className="flex min-h-12 items-center gap-3 border border-foreground/15 px-4">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateField('active', event.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  <span className="label-xs text-foreground/60">ACTIVA</span>
                </label>
              </div>
              {error ? <p className="mt-4 text-sm text-accent" role="alert">{error}</p> : null}
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-foreground/15 bg-background p-4 md:static md:px-6">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="min-h-12 flex-1 bg-foreground px-5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
              >
                {isPending ? 'GUARDANDO…' : 'GUARDAR'}
              </button>
              <button
                onClick={closeForm}
                className="min-h-12 flex-1 border border-foreground/15 px-5 text-xs tracking-widest text-foreground/50 hover:text-foreground"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-xs text-foreground/60">
        {label}{required ? ' *' : ''}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 border border-foreground/20 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
      />
    </label>
  )
}
