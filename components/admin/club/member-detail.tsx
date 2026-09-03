'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import {
  adjustClubPoints,
  previewClubPosterPurchase,
  redeemClubReward,
  registerClubPosterPurchase,
  registerClubPurchase,
  setClubMemberStatus,
  updateClubMember,
} from '@/app/admin/actions'
import { calculateClubCraftEarnPoints } from '@/lib/club-craft-points'
import { createClubCraftQrPayload, createClubCraftQrSvg } from '@/lib/club-craft-qr'
import type { PosterPurchasePreview } from '@/lib/poster'
import type { ClubMemberRow, PointsTransactionWithMember, RewardRow } from '@/lib/db-types'

type Props = {
  member: ClubMemberRow
  transactions: PointsTransactionWithMember[]
  rewards: RewardRow[]
}

type FormState = {
  first_name: string
  last_name: string
  phone: string
  email: string
  birth_date: string
  status: ClubMemberRow['status']
}

type PointsAction = 'purchase' | 'adjustment' | 'redeem' | null

const EMPTY_PURCHASE = {
  eligible_purchase_amount: '',
  reference_id: '',
  note: '',
}

const EMPTY_POSTER_PURCHASE = {
  transaction_id: '',
}

const EMPTY_ADJUSTMENT = {
  direction: 'add',
  points: '',
  reason: '',
  reference_id: '',
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
})

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const transactionTypeLabels: Record<PointsTransactionWithMember['transaction_type'], string> = {
  earn: 'Acumulación',
  redeem: 'Canje',
  adjustment: 'Ajuste',
  expiration: 'Expiración',
}

const transactionTypeClasses: Record<PointsTransactionWithMember['transaction_type'], string> = {
  earn: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  redeem: 'border-orange-300/30 bg-orange-500/10 text-orange-200',
  adjustment: 'border-sky-300/30 bg-sky-500/10 text-sky-200',
  expiration: 'border-foreground/20 bg-foreground/10 text-foreground/55',
}

function fullName(member: Pick<ClubMemberRow, 'first_name' | 'last_name'>) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ')
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return dateTimeFormatter.format(new Date(value))
}

function formatPosterDateTime(value: string | null) {
  if (!value) return '—'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/)
  if (match) {
    const [, year, month, day, hour, minute] = match
    return hour && minute ? `${day}/${month}/${year}, ${hour}:${minute}` : `${day}/${month}/${year}`
  }
  return formatDateTime(value)
}

function statusLabel(status: ClubMemberRow['status']) {
  return status === 'active' ? 'Activo' : 'Inactivo'
}

function memberToForm(member: ClubMemberRow): FormState {
  return {
    first_name: member.first_name,
    last_name: member.last_name ?? '',
    phone: member.phone,
    email: member.email ?? '',
    birth_date: member.birth_date ?? '',
    status: member.status,
  }
}

function formatReference(transaction: PointsTransactionWithMember) {
  if (!transaction.reference_type && !transaction.reference_id) return '—'
  const typeLabels: Record<string, string> = {
    manual_purchase: 'Compra manual',
    poster_transaction: 'Ticket Poster',
    manual_adjustment: 'Ajuste manual',
    reward: 'Recompensa',
  }
  const label = transaction.reference_type ? (typeLabels[transaction.reference_type] ?? transaction.reference_type) : 'Referencia'
  return transaction.reference_id ? `${label} · ${transaction.reference_id}` : label
}

function purchaseAmountFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  const amount = metadata?.eligible_purchase_amount
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : null
}

export function MemberDetail({ member, transactions, rewards }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [activeAction, setActiveAction] = useState<PointsAction>(null)
  const [selectedReward, setSelectedReward] = useState<RewardRow | null>(null)
  const [purchaseMode, setPurchaseMode] = useState<'poster' | 'manual'>('poster')
  const [purchaseForm, setPurchaseForm] = useState(EMPTY_PURCHASE)
  const [posterPurchaseForm, setPosterPurchaseForm] = useState(EMPTY_POSTER_PURCHASE)
  const [posterPreview, setPosterPreview] = useState<(PosterPurchasePreview & { alreadyRegistered: boolean }) | null>(null)
  const [adjustmentForm, setAdjustmentForm] = useState(EMPTY_ADJUSTMENT)
  const [form, setForm] = useState<FormState>(() => memberToForm(member))
  const [origin, setOrigin] = useState('')
  const [copiedPublicLink, setCopiedPublicLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const purchaseAmount = Number(purchaseForm.eligible_purchase_amount.replace(',', '.'))
  const purchasePoints = calculateClubCraftEarnPoints(purchaseAmount)
  const selectedRewardBalanceAfter = selectedReward ? member.points_balance - selectedReward.points_cost : null
  const qr = createClubCraftQrSvg(member.member_code, { size: 280 })
  const publicPath = `/club/${member.member_code}`
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value as FormState[keyof FormState] }))
  }

  function openAction(action: PointsAction) {
    setActiveAction(action)
    setSelectedReward(null)
    setActionError(null)
  }

  function closeAction() {
    setActiveAction(null)
    setSelectedReward(null)
    setPurchaseForm(EMPTY_PURCHASE)
    setPosterPurchaseForm(EMPTY_POSTER_PURCHASE)
    setPosterPreview(null)
    setAdjustmentForm(EMPTY_ADJUSTMENT)
    setActionError(null)
  }

  function closeEdit() {
    setEditing(false)
    setForm(memberToForm(member))
    setError(null)
  }

  function buildMemberFormData() {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.set(key, value))
    return formData
  }

  function handleSave() {
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await updateClubMember(member.id, buildMemberFormData())
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el miembro.')
      }
    })
  }

  function toggleStatus() {
    const nextStatus = member.status === 'active' ? 'inactive' : 'active'
    setError(null)
    startTransition(async () => {
      try {
        await setClubMemberStatus(member.id, nextStatus)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cambiar el estatus.')
      }
    })
  }

  function handlePurchase() {
    const formData = new FormData()
    Object.entries(purchaseForm).forEach(([key, value]) => formData.set(key, value))

    setActionError(null)
    startTransition(async () => {
      try {
        await registerClubPurchase(member.id, formData)
        closeAction()
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo registrar la compra.')
      }
    })
  }

  function handlePosterPreview() {
    setActionError(null)
    setPosterPreview(null)
    startTransition(async () => {
      try {
        const preview = await previewClubPosterPurchase(posterPurchaseForm.transaction_id)
        setPosterPreview(preview)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo consultar el ticket de Poster.')
      }
    })
  }

  function handlePosterPurchase() {
    setActionError(null)
    startTransition(async () => {
      try {
        await registerClubPosterPurchase(member.id, posterPurchaseForm.transaction_id)
        closeAction()
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo registrar el ticket de Poster.')
      }
    })
  }

  function handleAdjustment() {
    const formData = new FormData()
    Object.entries(adjustmentForm).forEach(([key, value]) => formData.set(key, value))

    setActionError(null)
    startTransition(async () => {
      try {
        await adjustClubPoints(member.id, formData)
        closeAction()
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo ajustar el balance.')
      }
    })
  }

  function handleRedemption() {
    if (!selectedReward) return

    setActionError(null)
    startTransition(async () => {
      try {
        await redeemClubReward(member.id, selectedReward.id)
        closeAction()
        router.refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo realizar el canje.')
      }
    })
  }

  async function copyPublicLink() {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(publicUrl)
    setCopiedPublicLink(true)
    window.setTimeout(() => setCopiedPublicLink(false), 1800)
  }

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!editing) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEdit()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editing])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <Link href="/admin/club/members" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-foreground/45 hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        MIEMBROS
      </Link>

      <div className="mb-6 flex flex-col gap-5 border-b border-foreground/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-xs text-muted-foreground">MIEMBRO CLUB CRAFT</p>
          <h1 className="display-tight mt-2 text-4xl text-foreground md:text-6xl">{fullName(member)}</h1>
          <p className="mt-2 font-mono text-xs text-foreground/45">{member.member_code}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground hover:border-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
            EDITAR MIEMBRO
          </button>
          <button
            onClick={toggleStatus}
            disabled={isPending}
            className="min-h-11 bg-foreground px-4 text-xs font-semibold tracking-widest text-background hover:bg-foreground/80 disabled:opacity-40"
          >
            {member.status === 'active' ? 'DESACTIVAR' : 'ACTIVAR'}
          </button>
        </div>
      </div>

      {error ? <p className="mb-5 text-sm text-accent" role="alert">{error}</p> : null}

      <section className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
        <div className="border border-foreground/10 bg-foreground/[0.03] p-4 md:p-6">
          <p className="label-xs text-muted-foreground">PUNTOS ACTUALES</p>
          <p className="mt-3 font-mono text-5xl font-semibold text-foreground md:text-6xl">
            {member.points_balance}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Última actividad: {formatDate(member.last_activity_at)}
          </p>
        </div>
        <div className="grid gap-2 md:min-w-64">
          <button
            type="button"
            onClick={() => openAction('purchase')}
            className="min-h-12 bg-accent px-4 text-xs font-semibold tracking-widest text-background transition-opacity hover:opacity-90"
          >
            REGISTRAR COMPRA
          </button>
          <button
            type="button"
            onClick={() => openAction('adjustment')}
            className="min-h-12 border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground transition-colors hover:border-foreground"
          >
            AJUSTAR PUNTOS
          </button>
          <button
            type="button"
            onClick={() => openAction('redeem')}
            className="min-h-12 border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground transition-colors hover:border-foreground"
          >
            CANJEAR RECOMPENSA
          </button>
        </div>
      </section>

      {activeAction ? (
        <section className="mb-6 border border-foreground/15 p-4 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
              <h2 className="mt-1 text-lg font-semibold tracking-widest text-foreground">
                {activeAction === 'purchase' ? 'REGISTRAR COMPRA' : activeAction === 'adjustment' ? 'AJUSTAR PUNTOS' : 'CANJEAR RECOMPENSA'}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeAction}
              className="inline-flex size-10 items-center justify-center border border-foreground/15"
              aria-label="Cerrar acción"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {activeAction === 'purchase' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 md:inline-grid md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseMode('poster')
                    setActionError(null)
                  }}
                  className={`min-h-11 border px-4 text-xs font-semibold tracking-widest ${
                    purchaseMode === 'poster'
                      ? 'border-accent bg-accent text-background'
                      : 'border-foreground/15 text-foreground/60 hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  POSTER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseMode('manual')
                    setActionError(null)
                  }}
                  className={`min-h-11 border px-4 text-xs font-semibold tracking-widest ${
                    purchaseMode === 'manual'
                      ? 'border-accent bg-accent text-background'
                      : 'border-foreground/15 text-foreground/60 hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  MANUAL
                </button>
              </div>

              {purchaseMode === 'poster' ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                      <Field
                        label="ID DE TICKET POSTER"
                        required
                        value={posterPurchaseForm.transaction_id}
                        onChange={(value) => {
                          setPosterPurchaseForm({ transaction_id: value })
                          setPosterPreview(null)
                        }}
                        placeholder="Ej. 12345"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        onClick={handlePosterPreview}
                        disabled={isPending || !posterPurchaseForm.transaction_id.trim()}
                        className="min-h-12 self-end border border-foreground/20 px-5 text-xs font-semibold tracking-widest text-foreground hover:border-foreground disabled:opacity-40 md:min-h-11"
                      >
                        {isPending ? 'CONSULTANDO…' : 'CALCULAR'}
                      </button>
                    </div>

                    {posterPreview ? (
                      <div className="border border-foreground/10">
                        <div className="grid gap-3 border-b border-foreground/10 p-4 text-sm md:grid-cols-3">
                          <Info label="Ticket" value={posterPreview.transactionId} mono />
                          <Info label="Sucursal Poster" value={posterPreview.spotName ?? posterPreview.spotId ?? '—'} />
                          <Info label="Fecha cierre" value={formatPosterDateTime(posterPreview.closedAt)} />
                        </div>
                        <div className="divide-y divide-foreground/10">
                          {posterPreview.eligibleItems.map((item, index) => (
                            <div key={`${item.productId ?? item.productName}-${index}`} className="grid gap-2 p-4 text-xs md:grid-cols-[minmax(0,1fr)_7rem_5rem] md:items-start">
                              <div>
                                <p className="font-semibold text-foreground">{item.productName}</p>
                                <p className="mt-1 text-foreground/45">
                                  {item.rootCategoryName ?? 'Sin categoría'} · {percentFormatter.format(item.pointsRate)}
                                </p>
                              </div>
                              <p className="font-mono text-foreground/70 md:text-right">{currencyFormatter.format(item.eligibleAmount)}</p>
                              <p className="font-mono font-semibold text-emerald-300 md:text-right">+{item.points}</p>
                            </div>
                          ))}
                          {posterPreview.eligibleItems.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">No hay productos elegibles en este ticket.</div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-foreground/10 p-4 text-sm text-muted-foreground">
                        Consulta un ticket cerrado de Poster para calcular automáticamente los puntos por cerveza.
                      </div>
                    )}
                  </div>
                  <div className="border border-foreground/10 p-4">
                    <p className="text-sm text-muted-foreground">Total ticket</p>
                    <p className="mt-1 font-mono text-xl text-foreground">
                      {posterPreview ? currencyFormatter.format(posterPreview.totalPaid) : '—'}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">Compra elegible</p>
                    <p className="mt-1 font-mono text-xl text-foreground">
                      {posterPreview ? currencyFormatter.format(posterPreview.eligibleAmount) : '—'}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">Puntos a generar</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-accent">+{posterPreview?.points ?? 0}</p>
                    {posterPreview?.alreadyRegistered ? (
                      <p className="mt-3 text-xs text-accent">Este ticket ya fue registrado.</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handlePosterPurchase}
                      disabled={isPending || !posterPreview || posterPreview.alreadyRegistered || posterPreview.points <= 0}
                      className="mt-5 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40"
                    >
                      {isPending ? 'GUARDANDO…' : 'CONFIRMAR TICKET POSTER'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="COMPRA ELEGIBLE"
                      required
                      value={purchaseForm.eligible_purchase_amount}
                      onChange={(value) => setPurchaseForm((prev) => ({ ...prev, eligible_purchase_amount: value }))}
                      placeholder="500"
                      inputMode="decimal"
                    />
                    <Field
                      label="REFERENCIA"
                      value={purchaseForm.reference_id}
                      onChange={(value) => setPurchaseForm((prev) => ({ ...prev, reference_id: value }))}
                      placeholder="Ticket / referencia opcional"
                    />
                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="label-xs text-foreground/60">NOTA</span>
                      <textarea
                        value={purchaseForm.note}
                        onChange={(event) => setPurchaseForm((prev) => ({ ...prev, note: event.target.value }))}
                        rows={3}
                        placeholder="Opcional"
                        className="border border-foreground/20 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:text-sm"
                      />
                    </label>
                  </div>
                  <div className="border border-foreground/10 p-4">
                    <p className="text-sm text-muted-foreground">Compra elegible</p>
                    <p className="mt-1 font-mono text-xl text-foreground">
                      {Number.isFinite(purchaseAmount) && purchaseAmount > 0 ? currencyFormatter.format(purchaseAmount) : '—'}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">Puntos a generar</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-accent">+{purchasePoints}</p>
                    <button
                      type="button"
                      onClick={handlePurchase}
                      disabled={isPending || purchasePoints <= 0}
                      className="mt-5 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40"
                    >
                      {isPending ? 'GUARDANDO…' : 'CONFIRMAR COMPRA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeAction === 'adjustment' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="label-xs text-foreground/60">TIPO</span>
                  <select
                    value={adjustmentForm.direction}
                    onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, direction: event.target.value }))}
                    className="min-h-12 border border-foreground/20 bg-background px-4 text-base text-foreground focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                  >
                    <option value="add">Sumar puntos</option>
                    <option value="remove">Restar puntos</option>
                  </select>
                </label>
                <Field
                  label="PUNTOS"
                  required
                  value={adjustmentForm.points}
                  onChange={(value) => setAdjustmentForm((prev) => ({ ...prev, points: value }))}
                  placeholder="50"
                  inputMode="numeric"
                />
                <Field
                  label="REFERENCIA"
                  value={adjustmentForm.reference_id}
                  onChange={(value) => setAdjustmentForm((prev) => ({ ...prev, reference_id: value }))}
                  placeholder="Opcional"
                />
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="label-xs text-foreground/60">MOTIVO *</span>
                  <textarea
                    value={adjustmentForm.reason}
                    onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, reason: event.target.value }))}
                    rows={3}
                    placeholder="Ej. Corrección de puntos duplicados"
                    className="border border-foreground/20 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:text-sm"
                  />
                </label>
              </div>
              <div className="border border-foreground/10 p-4">
                <p className="text-sm text-muted-foreground">Balance actual</p>
                <p className="mt-1 font-mono text-xl text-foreground">{member.points_balance} pts</p>
                <p className="mt-4 text-sm text-muted-foreground">Ajuste</p>
                <p className="mt-1 font-mono text-3xl font-semibold text-accent">
                  {adjustmentForm.direction === 'remove' ? '-' : '+'}{adjustmentForm.points || 0}
                </p>
                <button
                  type="button"
                  onClick={handleAdjustment}
                  disabled={isPending}
                  className="mt-5 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40"
                >
                  {isPending ? 'GUARDANDO…' : 'CONFIRMAR AJUSTE'}
                </button>
              </div>
            </div>
          ) : null}

          {activeAction === 'redeem' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid gap-3 md:grid-cols-2">
                {rewards.length === 0 ? (
                  <div className="border border-foreground/10 px-4 py-10 text-center md:col-span-2">
                    <p className="text-sm font-semibold">No hay recompensas activas</p>
                    <p className="mt-2 text-xs text-muted-foreground">Activa una recompensa para poder canjear puntos.</p>
                  </div>
                ) : null}
                {rewards.map((reward) => {
                  const canRedeem = member.points_balance >= reward.points_cost
                  return (
                    <button
                      key={reward.id}
                      type="button"
                      onClick={() => setSelectedReward(reward)}
                      className={`border p-4 text-left transition-colors ${
                        selectedReward?.id === reward.id
                          ? 'border-accent bg-accent/10'
                          : 'border-foreground/10 hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{reward.name}</p>
                          <p className="mt-1 font-mono text-sm text-accent">{reward.points_cost} pts</p>
                        </div>
                        <span className={`px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${
                          canRedeem ? 'bg-emerald-500/10 text-emerald-400' : 'bg-foreground/10 text-foreground/45'
                        }`}>
                          {canRedeem ? 'Disponible' : 'Sin puntos'}
                        </span>
                      </div>
                      {reward.description ? <p className="mt-3 text-sm text-muted-foreground">{reward.description}</p> : null}
                    </button>
                  )
                })}
              </div>
              <div className="border border-foreground/10 p-4">
                <p className="label-xs text-muted-foreground">CONFIRMACIÓN</p>
                {selectedReward ? (
                  <>
                    <p className="mt-4 text-sm text-muted-foreground">Recompensa</p>
                    <p className="mt-1 font-semibold text-foreground">{selectedReward.name}</p>
                    <p className="mt-4 text-sm text-muted-foreground">Costo</p>
                    <p className="mt-1 font-mono text-xl text-accent">-{selectedReward.points_cost} pts</p>
                    <p className="mt-4 text-sm text-muted-foreground">Balance actual</p>
                    <p className="mt-1 font-mono text-foreground">{member.points_balance} pts</p>
                    <p className="mt-4 text-sm text-muted-foreground">Balance después</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{selectedRewardBalanceAfter} pts</p>
                    <button
                      type="button"
                      onClick={handleRedemption}
                      disabled={isPending || selectedRewardBalanceAfter == null || selectedRewardBalanceAfter < 0}
                      className="mt-5 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40"
                    >
                      {isPending ? 'CANJEANDO…' : 'CONFIRMAR CANJE'}
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Selecciona una recompensa para revisar el canje.</p>
                )}
              </div>
            </div>
          ) : null}

          {actionError ? <p className="mt-4 text-sm text-accent" role="alert">{actionError}</p> : null}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="border border-foreground/10 p-4 md:p-6">
          <h2 className="label-xs mb-5 text-muted-foreground">HISTORIAL DE PUNTOS</h2>
          {transactions.length > 0 ? (
            <div className="divide-y divide-foreground/10">
              {transactions.map((transaction) => {
                const purchaseAmount = purchaseAmountFromMetadata(transaction.metadata)
                return (
                  <article key={transaction.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <span className={`inline-flex border px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${transactionTypeClasses[transaction.transaction_type]}`}>
                          {transactionTypeLabels[transaction.transaction_type]}
                        </span>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                      </div>
                      <p className={`font-mono text-2xl font-semibold ${transaction.points > 0 ? 'text-emerald-300' : 'text-accent'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-foreground/60 md:grid-cols-2">
                      <p><span className="text-foreground/35">Balance:</span> {transaction.balance_after}</p>
                      <p><span className="text-foreground/35">Creado por:</span> {transaction.created_by_profile?.full_name ?? '—'}</p>
                      <p><span className="text-foreground/35">Referencia:</span> {formatReference(transaction)}</p>
                      {purchaseAmount !== null ? (
                        <p><span className="text-foreground/35">Compra:</span> {currencyFormatter.format(purchaseAmount)}</p>
                      ) : null}
                    </div>
                    {transaction.reason ? <p className="mt-2 text-sm text-foreground/70">{transaction.reason}</p> : null}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold">Sin transacciones todavía</p>
              <p className="mt-2 text-xs text-muted-foreground">Registra una compra, ajuste o canje para iniciar el historial.</p>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="border border-foreground/10 p-4 md:p-6">
            <h2 className="label-xs mb-5 text-muted-foreground">MEMBER QR</h2>
            <div className="bg-white p-4" dangerouslySetInnerHTML={{ __html: qr.svg }} />
            <p className="mt-4 text-lg font-semibold text-foreground">{fullName(member)}</p>
            <p className="mt-1 font-mono text-xs text-foreground/45">{member.member_code}</p>
            <p className="mt-2 text-sm text-muted-foreground">{member.points_balance} puntos actuales</p>
            <p className="mt-3 break-all font-mono text-[0.65rem] text-foreground/35">
              {createClubCraftQrPayload(member.member_code)}
            </p>
            <Link
              href="/admin/club/scanner"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground hover:border-foreground"
            >
              ABRIR SCANNER TEST
            </Link>
          </section>

          <section className="border border-foreground/10 p-4 md:p-6">
            <h2 className="label-xs mb-5 text-muted-foreground">LINK PÚBLICO</h2>
            <p className="text-sm text-muted-foreground">
              Página personal del miembro. Solo muestra nombre, puntos y código QR.
            </p>
            <Link href={publicPath} target="_blank" className="mt-4 block break-all font-mono text-xs text-foreground hover:text-accent">
              {publicUrl}
            </Link>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={copyPublicLink}
                className="min-h-11 border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground hover:border-foreground"
              >
                {copiedPublicLink ? 'LINK COPIADO' : 'COPIAR LINK'}
              </button>
              <p className="text-xs text-foreground/40">
                El cliente puede guardar este link o tomar screenshot del QR para usarlo en barra.
              </p>
            </div>
          </section>

          <section className="border border-foreground/10 p-4 md:p-6">
            <h2 className="label-xs mb-5 text-muted-foreground">PERFIL</h2>
            <dl className="grid gap-5">
              <Info label="Nombre completo" value={fullName(member)} />
              <Info label="Código de miembro" value={member.member_code} mono />
              <Info label="Teléfono" value={member.phone} />
              <Info label="Email" value={member.email ?? '—'} />
              <Info label="Fecha de nacimiento" value={member.birth_date ? formatDate(member.birth_date) : '—'} />
              <Info label="Balance de puntos" value={`${member.points_balance} pts`} mono />
              <Info label="Estatus" value={statusLabel(member.status)} />
              <Info label="Fecha de alta" value={formatDate(member.created_at)} />
              <Info label="Última actividad" value={formatDate(member.last_activity_at)} />
            </dl>
          </section>
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background md:inset-0 md:grid md:place-items-center md:bg-background/80 md:p-6">
          <div className="flex min-h-0 w-full flex-1 flex-col bg-background md:max-w-3xl md:flex-none md:border md:border-foreground/20">
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-foreground/15 px-4 pt-[env(safe-area-inset-top)] md:px-6">
              <div>
                <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
                <h2 className="mt-1 text-base font-bold tracking-widest text-foreground">EDITAR MIEMBRO</h2>
              </div>
              <button onClick={closeEdit} className="inline-flex size-11 items-center justify-center border border-foreground/15" aria-label="Cerrar formulario">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="NOMBRE" required value={form.first_name} onChange={(value) => updateField('first_name', value)} placeholder="Ana" />
                <Field label="APELLIDO" value={form.last_name} onChange={(value) => updateField('last_name', value)} placeholder="López" />
                <Field label="TELÉFONO" required value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="+523312345678" inputMode="tel" />
                <Field label="EMAIL" value={form.email} onChange={(value) => updateField('email', value)} placeholder="ana@email.com" inputMode="email" />
                <Field label="FECHA DE NACIMIENTO" value={form.birth_date} onChange={(value) => updateField('birth_date', value)} type="date" />
                <label className="flex flex-col gap-1">
                  <span className="label-xs text-foreground/60">ESTATUS</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateField('status', event.target.value)}
                    className="min-h-12 border border-foreground/20 bg-background px-4 text-base text-foreground focus:border-foreground focus:outline-none md:min-h-11 md:text-sm"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
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
                {isPending ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
              </button>
              <button
                onClick={closeEdit}
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

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="label-xs text-foreground/35">{label}</dt>
      <dd className={`mt-1 text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-xs text-foreground/60">
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
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
