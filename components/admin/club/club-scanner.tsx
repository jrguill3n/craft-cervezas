'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import {
  adjustClubPoints,
  lookupClubMemberByQr,
  redeemClubReward,
  registerClubPurchase,
} from '@/app/admin/actions'
import { calculateClubCraftEarnPoints } from '@/lib/club-craft-points'
import { createClubCraftQrPayload, parseClubCraftQrPayload } from '@/lib/club-craft-qr'
import type { ClubMemberScannerRow, RewardRow } from '@/lib/db-types'

type Props = {
  rewards: RewardRow[]
}

type ScannerAction = 'purchase' | 'adjustment' | 'redeem' | null

const EMPTY_PURCHASE = {
  eligible_purchase_amount: '',
  reference_id: '',
  note: '',
}

const EMPTY_ADJUSTMENT = {
  direction: 'add',
  points: '',
  reason: '',
  reference_id: '',
}

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
})

function fullName(member: Pick<ClubMemberScannerRow, 'first_name' | 'last_name'>) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ')
}

function formDataFromObject(values: Record<string, string>) {
  const formData = new FormData()
  Object.entries(values).forEach(([key, value]) => formData.set(key, value))
  return formData
}

export function ClubScanner({ rewards }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [member, setMember] = useState<ClubMemberScannerRow | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ScannerAction>(null)
  const [selectedReward, setSelectedReward] = useState<RewardRow | null>(null)
  const [purchaseForm, setPurchaseForm] = useState(EMPTY_PURCHASE)
  const [adjustmentForm, setAdjustmentForm] = useState(EMPTY_ADJUSTMENT)
  const [isPending, startTransition] = useTransition()

  const memberInactive = member?.status === 'inactive'
  const purchaseAmount = Number(purchaseForm.eligible_purchase_amount.replace(',', '.'))
  const purchasePoints = calculateClubCraftEarnPoints(purchaseAmount)

  async function lookupPayload(payload: string) {
    setMessage(null)
    const parsed = parseClubCraftQrPayload(payload)
    if (!parsed) {
      setMessage('El QR o código no es válido.')
      return
    }

    try {
      const result = await lookupClubMemberByQr(createClubCraftQrPayload(parsed))
      setMember(result as ClubMemberScannerRow)
      setActiveAction(null)
      setSelectedReward(null)
      setMessage(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No encontramos ese miembro.')
    }
  }

  function handleManualLookup() {
    startTransition(async () => {
      await lookupPayload(manualCode)
    })
  }

  function resetForNextScan() {
    setMember(null)
    setManualCode('')
    setMessage(null)
    setActiveAction(null)
    setSelectedReward(null)
    setPurchaseForm(EMPTY_PURCHASE)
    setAdjustmentForm(EMPTY_ADJUSTMENT)
  }

  function refreshMemberByCurrentCode() {
    if (!member) return
    startTransition(async () => {
      await lookupPayload(member.member_code)
    })
  }

  function handlePurchase() {
    if (!member || memberInactive) return
    startTransition(async () => {
      try {
        await registerClubPurchase(member.id, formDataFromObject(purchaseForm))
        setPurchaseForm(EMPTY_PURCHASE)
        setActiveAction(null)
        setMessage('Compra registrada.')
        refreshMemberByCurrentCode()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo registrar la compra.')
      }
    })
  }

  function handleAdjustment() {
    if (!member || memberInactive) return
    startTransition(async () => {
      try {
        await adjustClubPoints(member.id, formDataFromObject(adjustmentForm))
        setAdjustmentForm(EMPTY_ADJUSTMENT)
        setActiveAction(null)
        setMessage('Puntos ajustados.')
        refreshMemberByCurrentCode()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo ajustar el balance.')
      }
    })
  }

  function handleRedeem() {
    if (!member || memberInactive || !selectedReward) return
    startTransition(async () => {
      try {
        await redeemClubReward(member.id, selectedReward.id)
        setSelectedReward(null)
        setActiveAction(null)
        setMessage('Canje realizado.')
        refreshMemberByCurrentCode()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo realizar el canje.')
      }
    })
  }

  async function startCamera() {
    setCameraError(null)
    const BarcodeDetectorCtor = (window as any).BarcodeDetector
    if (!BarcodeDetectorCtor) {
      setCameraError('Este navegador no soporta scanner de QR con cámara. Usa búsqueda manual.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      setCameraError('No se pudo abrir la cámara. Revisa permisos o usa búsqueda manual.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => {
    if (!cameraActive || !videoRef.current) return
    let stopped = false
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })

    async function tick() {
      if (stopped || !videoRef.current) return
      try {
        const codes = await detector.detect(videoRef.current)
        const value = codes?.[0]?.rawValue
        if (value) {
          stopped = true
          stopCamera()
          await lookupPayload(value)
          return
        }
      } catch {
        setCameraError('No se pudo leer el QR. Intenta de nuevo o usa búsqueda manual.')
      }
      window.setTimeout(tick, 450)
    }

    tick()
    return () => {
      stopped = true
    }
  }, [cameraActive])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-6">
        <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
        <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Scanner</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escanea un QR o escribe el código del miembro.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_1fr]">
        <section className="border border-foreground/10 p-4 md:p-6">
          <div className="aspect-video overflow-hidden border border-foreground/10 bg-foreground/[0.03]">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className="min-h-12 bg-foreground px-4 text-xs font-semibold tracking-widest text-background"
            >
              {cameraActive ? 'DETENER CÁMARA' : 'ABRIR CÁMARA'}
            </button>
            <button
              type="button"
              onClick={resetForNextScan}
              className="min-h-12 border border-foreground/20 px-4 text-xs font-semibold tracking-widest text-foreground"
            >
              ESCANEAR SIGUIENTE
            </button>
          </div>
          {cameraError ? <p className="mt-3 text-sm text-accent">{cameraError}</p> : null}

          <div className="mt-6 border-t border-foreground/10 pt-5">
            <label htmlFor="manual-member-code" className="label-xs text-foreground/50">
              CÓDIGO DE MIEMBRO
            </label>
            <div className="mt-2 flex min-h-12 items-center border border-foreground/20 focus-within:border-foreground">
              <Search className="ml-4 size-4 shrink-0 text-foreground/35" aria-hidden="true" />
              <input
                id="manual-member-code"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="CC-A1B2C3D4"
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-foreground placeholder:text-foreground/25 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleManualLookup}
              disabled={isPending}
              className="mt-3 min-h-12 w-full bg-accent px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40"
            >
              BUSCAR MIEMBRO
            </button>
          </div>
        </section>

        <section className="min-h-72 border border-foreground/10 p-4 md:p-6">
          {message ? <p className="mb-4 text-sm text-accent" role="alert">{message}</p> : null}
          {!member ? (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <p className="text-lg font-semibold">Sin miembro seleccionado</p>
                <p className="mt-2 text-sm text-muted-foreground">Escanea o busca un código para empezar.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-foreground/10 pb-5">
                <div>
                  <p className="label-xs text-muted-foreground">MIEMBRO</p>
                  <h2 className="display-tight mt-2 text-4xl text-foreground">{fullName(member)}</h2>
                  <p className="mt-2 font-mono text-xs text-foreground/45">{member.member_code}</p>
                </div>
                <button type="button" onClick={resetForNextScan} className="inline-flex size-10 items-center justify-center border border-foreground/15" aria-label="Cerrar miembro">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-foreground/10 p-4">
                  <p className="label-xs text-muted-foreground">PUNTOS</p>
                  <p className="mt-2 font-mono text-4xl font-semibold">{member.points_balance}</p>
                </div>
                <div className="border border-foreground/10 p-4">
                  <p className="label-xs text-muted-foreground">ESTATUS</p>
                  <p className={`mt-3 text-sm font-semibold uppercase tracking-widest ${memberInactive ? 'text-accent' : 'text-emerald-300'}`}>
                    {memberInactive ? 'Inactivo' : 'Activo'}
                  </p>
                </div>
                <Link href={`/admin/club/members/${member.id}`} className="grid min-h-24 place-items-center border border-foreground/10 p-4 text-xs font-semibold tracking-widest text-foreground hover:border-foreground">
                  VER MIEMBRO
                </Link>
              </div>

              {memberInactive ? (
                <div className="mt-4 border border-accent/40 bg-accent/10 p-4 text-sm text-accent">
                  Este miembro está inactivo. No se pueden registrar compras, ajustes ni canjes.
                </div>
              ) : (
                <div className="mt-5 grid gap-2 md:grid-cols-3">
                  <ActionButton active={activeAction === 'purchase'} onClick={() => setActiveAction('purchase')}>REGISTRAR COMPRA</ActionButton>
                  <ActionButton active={activeAction === 'adjustment'} onClick={() => setActiveAction('adjustment')}>AJUSTAR PUNTOS</ActionButton>
                  <ActionButton active={activeAction === 'redeem'} onClick={() => setActiveAction('redeem')}>CANJEAR</ActionButton>
                </div>
              )}

              {activeAction === 'purchase' && !memberInactive ? (
                <div className="mt-5 border border-foreground/10 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="COMPRA ELEGIBLE" value={purchaseForm.eligible_purchase_amount} onChange={(value) => setPurchaseForm((prev) => ({ ...prev, eligible_purchase_amount: value }))} placeholder="500" inputMode="decimal" />
                    <Field label="REFERENCIA" value={purchaseForm.reference_id} onChange={(value) => setPurchaseForm((prev) => ({ ...prev, reference_id: value }))} placeholder="Ticket opcional" />
                    <Field label="NOTA" value={purchaseForm.note} onChange={(value) => setPurchaseForm((prev) => ({ ...prev, note: value }))} placeholder="Opcional" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Compra elegible: {Number.isFinite(purchaseAmount) && purchaseAmount > 0 ? currencyFormatter.format(purchaseAmount) : '—'} · Puntos a generar: <span className="text-accent">+{purchasePoints}</span>
                  </p>
                  <button onClick={handlePurchase} disabled={isPending || purchasePoints <= 0} className="mt-4 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40">
                    CONFIRMAR COMPRA
                  </button>
                </div>
              ) : null}

              {activeAction === 'adjustment' && !memberInactive ? (
                <div className="mt-5 border border-foreground/10 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="label-xs text-foreground/60">TIPO</span>
                      <select value={adjustmentForm.direction} onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, direction: event.target.value }))} className="min-h-12 border border-foreground/20 bg-background px-4 text-base text-foreground focus:border-foreground focus:outline-none md:text-sm">
                        <option value="add">Sumar puntos</option>
                        <option value="remove">Restar puntos</option>
                      </select>
                    </label>
                    <Field label="PUNTOS" value={adjustmentForm.points} onChange={(value) => setAdjustmentForm((prev) => ({ ...prev, points: value }))} placeholder="50" inputMode="numeric" />
                    <Field label="REFERENCIA" value={adjustmentForm.reference_id} onChange={(value) => setAdjustmentForm((prev) => ({ ...prev, reference_id: value }))} placeholder="Opcional" />
                    <Field label="MOTIVO" value={adjustmentForm.reason} onChange={(value) => setAdjustmentForm((prev) => ({ ...prev, reason: value }))} placeholder="Obligatorio" />
                  </div>
                  <button onClick={handleAdjustment} disabled={isPending} className="mt-4 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40">
                    CONFIRMAR AJUSTE
                  </button>
                </div>
              ) : null}

              {activeAction === 'redeem' && !memberInactive ? (
                <div className="mt-5 border border-foreground/10 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {rewards.map((reward) => {
                      const enoughPoints = member.points_balance >= reward.points_cost
                      return (
                        <button
                          key={reward.id}
                          type="button"
                          onClick={() => setSelectedReward(reward)}
                          className={`border p-4 text-left ${selectedReward?.id === reward.id ? 'border-accent bg-accent/10' : 'border-foreground/10'}`}
                        >
                          <p className="font-semibold">{reward.name}</p>
                          <p className="mt-1 font-mono text-sm text-accent">{reward.points_cost} pts</p>
                          <p className="mt-2 text-xs text-muted-foreground">{enoughPoints ? 'Disponible' : 'Puntos insuficientes'}</p>
                        </button>
                      )
                    })}
                  </div>
                  {selectedReward ? (
                    <div className="mt-4 border-t border-foreground/10 pt-4">
                      <p className="text-sm text-muted-foreground">
                        {selectedReward.name} · Costo: {selectedReward.points_cost} pts · Balance después: {member.points_balance - selectedReward.points_cost} pts
                      </p>
                      <button onClick={handleRedeem} disabled={isPending || member.points_balance < selectedReward.points_cost} className="mt-4 min-h-12 w-full bg-foreground px-4 text-xs font-semibold tracking-widest text-background disabled:opacity-40">
                        CONFIRMAR CANJE
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ActionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 border px-4 text-xs font-semibold tracking-widest ${
        active ? 'border-accent bg-accent text-background' : 'border-foreground/20 text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-xs text-foreground/60">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-h-12 border border-foreground/20 bg-transparent px-4 text-base text-foreground placeholder:text-foreground/25 focus:border-foreground focus:outline-none md:text-sm"
      />
    </label>
  )
}
