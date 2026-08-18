'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import type { PromotionRow } from '@/lib/db-types'
import { createPromotion, deletePromotion, updatePromotion } from '@/app/admin/actions'
import { normalizeInstagramUrl } from '@/lib/instagram'
import {
  createClient,
  type SupabaseBrowserConfig,
} from '@/lib/supabase/client'

type Props = {
  promotions: PromotionRow[]
  supabaseConfig: SupabaseBrowserConfig
}

type FormState = {
  title: string
  image_url: string
  instagram_url: string
  sort_order: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  image_url: '',
  instagram_url: '',
  sort_order: '1',
  active: true,
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function promotionToForm(promotion: PromotionRow): FormState {
  return {
    title: promotion.title,
    image_url: promotion.image_url,
    instagram_url: normalizeInstagramUrl(promotion.instagram_url),
    sort_order: String(promotion.sort_order),
    active: promotion.active,
  }
}

function buildFormData(form: FormState) {
  const formData = new FormData()
  formData.set('title', form.title)
  formData.set('image_url', form.image_url)
  formData.set('instagram_url', form.instagram_url)
  formData.set('sort_order', form.sort_order)
  formData.set('active', String(form.active))
  return formData
}

function safeFileName(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const base = file.name
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'poster'
  return `${crypto.randomUUID()}-${base}.${extension}`
}

export function PromotionsEditor({ promotions, supabaseConfig }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<PromotionRow | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<PromotionRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const orderedPromotions = useMemo(
    () => promotions.slice().sort((a, b) => a.sort_order - b.sort_order),
    [promotions],
  )

  const activeCount = promotions.filter((promotion) => promotion.active).length
  const showForm = creating || editing !== null

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

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

  function startCreate() {
    const usedOrders = new Set(promotions.filter((promotion) => promotion.active).map((promotion) => promotion.sort_order))
    const nextOrder = [1, 2, 3, 4, 5, 6].find((order) => !usedOrders.has(order)) ?? 1
    setEditing(null)
    setCreating(true)
    setSelectedFile(null)
    setError(null)
    setForm({ ...EMPTY_FORM, sort_order: String(nextOrder), active: activeCount < 6 })
  }

  function startEdit(promotion: PromotionRow) {
    setCreating(false)
    setEditing(promotion)
    setSelectedFile(null)
    setError(null)
    setForm(promotionToForm(promotion))
  }

  function cancel() {
    setCreating(false)
    setEditing(null)
    setSelectedFile(null)
    setError(null)
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFile(file: File | null) {
    setError(null)
    if (!file) {
      setSelectedFile(null)
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('El póster debe ser JPG, PNG o WebP.')
      return
    }
    setSelectedFile(file)
  }

  async function uploadPoster(file: File) {
    const supabase = createClient(supabaseConfig)
    const path = safeFileName(file)
    const { error: uploadError } = await supabase.storage
      .from('promotions')
      .upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data } = supabase.storage.from('promotions').getPublicUrl(path)
    if (!data.publicUrl) throw new Error('No se pudo obtener la URL pública del póster.')
    return data.publicUrl
  }

  function validateBeforeSave() {
    if (!form.title.trim()) return 'El título es obligatorio.'
    if (!form.instagram_url.trim()) return 'El link de Instagram es obligatorio.'
    if (!form.image_url && !selectedFile) return 'Sube un póster antes de guardar.'
    const order = Number(form.sort_order)
    if (!Number.isInteger(order) || order < 1 || order > 6) return 'El orden debe ser del 1 al 6.'
    if (form.active && !editing?.active && activeCount >= 6) {
      return 'Ya hay 6 promociones activas. Desactiva o elimina una antes.'
    }
    return null
  }

  function handleSave() {
    const validationError = validateBeforeSave()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        let imageUrl = form.image_url
        if (selectedFile) {
          imageUrl = await uploadPoster(selectedFile)
        }

        const payload = buildFormData({ ...form, image_url: imageUrl })
        if (editing) {
          await updatePromotion(editing.id, payload)
        } else {
          await createPromotion(payload)
        }

        cancel()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar la promoción.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deletePromotion(id)
        setDeleteCandidate(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar la promoción.')
      }
    })
  }

  const preview = previewUrl ?? form.image_url

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-8 md:items-center">
        <div>
          <p className="label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
          <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Promociones</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {activeCount} de 6 activas · Pósters recomendados en formato 4:5
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-foreground px-4 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 md:px-5"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="md:hidden">NUEVA</span>
            <span className="hidden md:inline">NUEVA PROMO</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background md:static md:mb-8 md:block md:h-auto md:max-h-none md:border md:border-foreground/20 md:p-6">
          <div className="relative z-10 flex min-h-16 shrink-0 items-center justify-between border-b border-foreground/15 bg-background px-4 pt-[env(safe-area-inset-top)] md:static md:mb-5 md:min-h-0 md:border-0 md:p-0">
            <div>
              <p className="label-xs text-muted-foreground md:hidden">PROMOCIONES</p>
              <h2 className="mt-1 text-base font-bold tracking-widest text-foreground md:mt-0 md:text-sm">
                {editing ? 'EDITAR PROMOCIÓN' : 'NUEVA PROMOCIÓN'}
              </h2>
            </div>
            <button onClick={cancel} className="inline-flex size-11 items-center justify-center border border-foreground/15 md:hidden" aria-label="Cerrar formulario">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [-webkit-overflow-scrolling:touch] md:overflow-visible md:p-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="label-xs text-foreground/60" htmlFor="promotion-title">TÍTULO CORTO</label>
                  <input
                    id="promotion-title"
                    required
                    value={form.title}
                    onChange={(event) => setField('title', event.target.value)}
                    placeholder="Ej. Miércoles 3x2"
                    className="min-h-12 border border-foreground/20 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="label-xs text-foreground/60" htmlFor="promotion-instagram">LINK DE INSTAGRAM</label>
                  <input
                    id="promotion-instagram"
                    required
                    type="url"
                    inputMode="url"
                    value={form.instagram_url}
                    onChange={(event) => setField('instagram_url', event.target.value)}
                    onBlur={() => setField('instagram_url', normalizeInstagramUrl(form.instagram_url))}
                    placeholder="https://www.instagram.com/p/..."
                    className="min-h-12 border border-foreground/20 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="label-xs text-foreground/60" htmlFor="promotion-order">ORDEN</label>
                  <select
                    id="promotion-order"
                    value={form.sort_order}
                    onChange={(event) => setField('sort_order', event.target.value)}
                    className="min-h-12 border border-foreground/20 bg-background px-4 text-base text-foreground focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((order) => (
                      <option key={order} value={order}>{order}</option>
                    ))}
                  </select>
                </div>

                <label className="flex min-h-12 items-center justify-between gap-4 border border-foreground/20 px-4 md:min-h-11">
                  <span className="label-xs text-foreground/60">ACTIVA</span>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setField('active', event.target.checked)}
                    className="size-5 accent-[var(--accent)]"
                  />
                </label>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="label-xs text-foreground/60" htmlFor="promotion-poster">PÓSTER</label>
                  <input
                    id="promotion-poster"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                    className="min-h-12 border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground file:mr-4 file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-xs file:font-semibold file:tracking-widest file:text-background"
                  />
                  {form.image_url && !selectedFile ? (
                    <p className="break-all text-xs text-muted-foreground">Actual: {form.image_url}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="label-xs mb-2 text-foreground/60">PREVIEW 4:5</p>
                <div className="relative aspect-[4/5] overflow-hidden border border-foreground/20 bg-foreground/5">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
                      Sube un JPG, PNG o WebP para previsualizar el póster.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="mt-4 text-xs text-accent" role="alert">{error}</p>}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedPromotions.length === 0 ? (
          <div className="border border-foreground/10 px-5 py-16 text-center md:col-span-2 xl:col-span-3">
            <p className="text-base font-semibold">Sin promociones todavía</p>
            <p className="mt-2 text-sm text-muted-foreground">Crea una promoción activa para mostrarla en la home.</p>
          </div>
        ) : (
          orderedPromotions.map((promotion) => (
            <article key={promotion.id} className="border border-foreground/10">
              <button
                type="button"
                onClick={() => startEdit(promotion)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5">
                  <Image
                    src={promotion.image_url}
                    alt={promotion.title}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                    unoptimized={promotion.image_url.startsWith('http')}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="label-xs text-accent">#{promotion.sort_order}</span>
                    <span className={`label-xs ${promotion.active ? 'text-foreground' : 'text-foreground/35'}`}>
                      {promotion.active ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-tight">{promotion.title}</h2>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{normalizeInstagramUrl(promotion.instagram_url)}</p>
                </div>
              </button>
              <div className="flex border-t border-foreground/10">
                <button
                  onClick={() => startEdit(promotion)}
                  className="min-h-11 flex-1 text-xs font-semibold tracking-widest text-foreground/60 hover:text-foreground"
                >
                  EDITAR
                </button>
                <button
                  onClick={() => {
                    setError(null)
                    setDeleteCandidate(promotion)
                  }}
                  className="inline-flex min-h-11 w-14 items-center justify-center border-l border-foreground/10 text-foreground/35 hover:text-accent"
                  aria-label={`Eliminar ${promotion.title}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
          <div className="w-full max-w-md border border-foreground/20 bg-background p-6">
            <h2 className="text-xl font-semibold">¿Eliminar {deleteCandidate.title}?</h2>
            <p className="mt-3 text-sm text-muted-foreground">La promoción desaparecerá de la home si estaba activa.</p>
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
