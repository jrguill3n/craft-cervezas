'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus, Search, X } from 'lucide-react'
import { createClubMember } from '@/app/admin/actions'
import type { ClubMemberRow } from '@/lib/db-types'

type Props = {
  members: ClubMemberRow[]
}

type StatusFilter = 'all' | 'active' | 'inactive'

type FormState = {
  first_name: string
  last_name: string
  phone: string
  email: string
  birth_date: string
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  birth_date: '',
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
})

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function fullName(member: Pick<ClubMemberRow, 'first_name' | 'last_name'>) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ')
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}

function statusLabel(status: ClubMemberRow['status']) {
  return status === 'active' ? 'Activo' : 'Inactivo'
}

export function MembersManager({ members }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const visibleMembers = useMemo(() => {
    const query = normalizeSearch(search)
    return members.filter((member) => {
      if (status !== 'all' && member.status !== status) return false
      if (!query) return true
      return normalizeSearch([
        member.first_name,
        member.last_name,
        member.phone,
        member.email,
        member.member_code,
      ].filter(Boolean).join(' ')).includes(query)
    })
  }, [members, search, status])

  const resultText = search.trim() || status !== 'active'
    ? `${visibleMembers.length} de ${members.length} miembro${visibleMembers.length !== 1 ? 's' : ''}`
    : `${members.length} miembro${members.length !== 1 ? 's' : ''}`

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function closeForm() {
    setCreating(false)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function buildFormData() {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.set(key, value))
    return formData
  }

  function handleCreate() {
    if (!form.first_name.trim() || !form.phone.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const result = await createClubMember(buildFormData())
        closeForm()
        router.push(`/admin/club/members/${result.id}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el miembro.')
      }
    })
  }

  useEffect(() => {
    if (!creating) return
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
  }, [creating])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-8 md:items-center">
        <div>
          <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
          <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Miembros</h1>
          <p className="mt-2 text-xs text-muted-foreground">{resultText}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-foreground px-4 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 md:px-5"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="md:hidden">AGREGAR</span>
          <span className="hidden md:inline">AGREGAR MIEMBRO</span>
        </button>
      </div>

      <section className="mb-5 space-y-4 border-y border-foreground/10 py-4 md:mb-6 md:border md:border-foreground/10 md:p-4">
        <div>
          <label htmlFor="member-search" className="label-xs text-foreground/50">
            BUSCAR POR NOMBRE, TELÉFONO, EMAIL O CÓDIGO
          </label>
          <div className="mt-2 flex min-h-12 items-center border border-foreground/20 focus-within:border-foreground">
            <Search className="ml-4 size-4 shrink-0 text-foreground/35" aria-hidden="true" />
            <input
              id="member-search"
              type="search"
              inputMode="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. Ana, 3312345678, CC-..."
              className="min-w-0 flex-1 bg-transparent px-3 text-base text-foreground placeholder:text-foreground/25 focus:outline-none md:text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['active', 'Activos'],
            ['inactive', 'Inactivos'],
            ['all', 'Todos'],
          ] as [StatusFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`min-h-10 border px-4 text-xs font-semibold tracking-widest transition-colors ${
                status === value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/15 text-foreground/55 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="divide-y divide-foreground/10 border-y border-foreground/10 xl:hidden">
        {visibleMembers.length === 0 && (
          <EmptyMembers membersCount={members.length} />
        )}
        {visibleMembers.map((member) => (
          <Link
            key={member.id}
            href={`/admin/club/members/${member.id}`}
            className="flex min-h-[6.5rem] items-center gap-3 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="truncate text-base font-semibold">{fullName(member)}</h2>
                <StatusBadge status={member.status} />
              </div>
              <p className="mt-1 truncate font-mono text-xs text-foreground/45">{member.member_code}</p>
              <p className="mt-2 truncate text-sm text-muted-foreground">{member.phone}{member.email ? ` · ${member.email}` : ''}</p>
              <p className="mt-1 text-xs text-foreground/45">{member.points_balance} pts · Alta {formatDate(member.created_at)}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-foreground/35" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="hidden overflow-auto xl:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="label-xs pb-3 pr-6 text-muted-foreground">NOMBRE</th>
              <th className="label-xs pb-3 pr-6 text-muted-foreground">TELÉFONO</th>
              <th className="label-xs pb-3 pr-6 text-muted-foreground">EMAIL</th>
              <th className="label-xs pb-3 pr-6 text-muted-foreground">PUNTOS</th>
              <th className="label-xs pb-3 pr-6 text-muted-foreground">ESTATUS</th>
              <th className="label-xs pb-3 pr-6 text-muted-foreground">FECHA DE ALTA</th>
              <th className="label-xs pb-3 text-muted-foreground">ÚLTIMA ACTIVIDAD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            {visibleMembers.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyMembers membersCount={members.length} />
                </td>
              </tr>
            )}
            {visibleMembers.map((member) => (
              <tr key={member.id} className="group">
                <td className="py-4 pr-6">
                  <Link href={`/admin/club/members/${member.id}`} className="font-semibold text-foreground hover:text-accent">
                    {fullName(member)}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-foreground/35">{member.member_code}</p>
                </td>
                <td className="py-4 pr-6 font-mono text-xs text-foreground/70">{member.phone}</td>
                <td className="py-4 pr-6 text-xs text-foreground/70">{member.email ?? '—'}</td>
                <td className="py-4 pr-6 font-mono text-xs font-semibold text-foreground">{member.points_balance}</td>
                <td className="py-4 pr-6"><StatusBadge status={member.status} /></td>
                <td className="py-4 pr-6 text-xs text-foreground/60">{formatDate(member.created_at)}</td>
                <td className="py-4 text-xs text-foreground/60">{formatDate(member.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background md:inset-0 md:grid md:place-items-center md:bg-background/80 md:p-6">
          <div className="flex min-h-0 w-full flex-1 flex-col bg-background md:max-w-3xl md:flex-none md:border md:border-foreground/20">
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-foreground/15 px-4 pt-[env(safe-area-inset-top)] md:px-6">
              <div>
                <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
                <h2 className="mt-1 text-base font-bold tracking-widest text-foreground">AGREGAR MIEMBRO</h2>
              </div>
              <button onClick={closeForm} className="inline-flex size-11 items-center justify-center border border-foreground/15" aria-label="Cerrar formulario">
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
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Email y fecha de nacimiento son opcionales por ahora; el formulario ya queda listo para volverlos obligatorios después.
              </p>
              {error ? <p className="mt-4 text-sm text-accent" role="alert">{error}</p> : null}
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-foreground/15 bg-background p-4 md:static md:px-6">
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="min-h-12 flex-1 bg-foreground px-5 text-xs font-semibold tracking-widest text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
              >
                {isPending ? 'CREANDO…' : 'CREAR MIEMBRO'}
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

function StatusBadge({ status }: { status: ClubMemberRow['status'] }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${
      status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-foreground/10 text-foreground/45'
    }`}>
      {statusLabel(status)}
    </span>
  )
}

function EmptyMembers({ membersCount }: { membersCount: number }) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-base font-semibold">{membersCount === 0 ? 'No hay miembros todavía' : 'Sin resultados'}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {membersCount === 0 ? 'Crea el primer miembro de Club Craft.' : 'Prueba con otro nombre, teléfono, email o código.'}
      </p>
    </div>
  )
}
