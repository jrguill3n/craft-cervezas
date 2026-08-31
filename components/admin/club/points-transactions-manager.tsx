'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { PointsTransactionWithMember } from '@/lib/db-types'

type Props = {
  transactions: PointsTransactionWithMember[]
}

type TransactionFilter = 'all' | PointsTransactionWithMember['transaction_type']

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
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

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function fullName(member: PointsTransactionWithMember['club_members']) {
  if (!member) return '—'
  return [member.first_name, member.last_name].filter(Boolean).join(' ')
}

function formatReference(transaction: PointsTransactionWithMember) {
  if (!transaction.reference_type && !transaction.reference_id) return transaction.reason ?? '—'
  const typeLabels: Record<string, string> = {
    manual_purchase: 'Compra manual',
    manual_adjustment: 'Ajuste manual',
    reward: 'Recompensa',
  }
  const label = transaction.reference_type ? (typeLabels[transaction.reference_type] ?? transaction.reference_type) : 'Referencia'
  const reference = transaction.reference_id ? `${label} · ${transaction.reference_id}` : label
  return transaction.reason ? `${reference} · ${transaction.reason}` : reference
}

export function PointsTransactionsManager({ transactions }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TransactionFilter>('all')

  const visibleTransactions = useMemo(() => {
    const query = normalizeSearch(search)
    return transactions.filter((transaction) => {
      if (filter !== 'all' && transaction.transaction_type !== filter) return false
      if (!query) return true
      const member = transaction.club_members
      return normalizeSearch([
        member?.first_name,
        member?.last_name,
        member?.phone,
        member?.member_code,
      ].filter(Boolean).join(' ')).includes(query)
    })
  }, [filter, search, transactions])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-8">
        <p className="label-xs text-muted-foreground">CLUB CRAFT</p>
        <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Transacciones</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {visibleTransactions.length} de {transactions.length} transacción{transactions.length !== 1 ? 'es' : ''}
        </p>
      </div>

      <section className="mb-5 space-y-4 border-y border-foreground/10 py-4 md:mb-6 md:border md:border-foreground/10 md:p-4">
        <div>
          <label htmlFor="transaction-search" className="label-xs text-foreground/50">
            BUSCAR POR MIEMBRO, TELÉFONO O CÓDIGO
          </label>
          <div className="mt-2 flex min-h-12 items-center border border-foreground/20 focus-within:border-foreground">
            <Search className="ml-4 size-4 shrink-0 text-foreground/35" aria-hidden="true" />
            <input
              id="transaction-search"
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
            ['all', 'Todas'],
            ['earn', 'Acumulación'],
            ['redeem', 'Canje'],
            ['adjustment', 'Ajuste'],
            ['expiration', 'Expiración'],
          ] as [TransactionFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-10 border px-4 text-xs font-semibold tracking-widest transition-colors ${
                filter === value
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
        {visibleTransactions.length === 0 ? <EmptyTransactions /> : null}
        {visibleTransactions.map((transaction) => (
          <article key={transaction.id} className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{fullName(transaction.club_members)}</p>
                <p className="mt-1 font-mono text-xs text-foreground/35">{transaction.club_members?.member_code ?? '—'}</p>
              </div>
              <p className={`font-mono text-lg font-semibold ${transaction.points > 0 ? 'text-emerald-300' : 'text-accent'}`}>
                {transaction.points > 0 ? '+' : ''}{transaction.points}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex border px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${transactionTypeClasses[transaction.transaction_type]}`}>
                {transactionTypeLabels[transaction.transaction_type]}
              </span>
              <span className="text-xs text-muted-foreground">{dateTimeFormatter.format(new Date(transaction.created_at))}</span>
            </div>
            <p className="mt-2 text-xs text-foreground/60">Balance: {transaction.balance_after}</p>
            <p className="mt-1 text-xs text-foreground/60">{formatReference(transaction)}</p>
            <p className="mt-1 text-xs text-foreground/45">Creado por: {transaction.created_by_profile?.full_name ?? '—'}</p>
          </article>
        ))}
      </div>

      <div className="hidden overflow-auto xl:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="label-xs p-4 text-muted-foreground">FECHA</th>
              <th className="label-xs p-4 text-muted-foreground">MIEMBRO</th>
              <th className="label-xs p-4 text-muted-foreground">TIPO</th>
              <th className="label-xs p-4 text-muted-foreground">PUNTOS</th>
              <th className="label-xs p-4 text-muted-foreground">BALANCE</th>
              <th className="label-xs p-4 text-muted-foreground">MOTIVO / REFERENCIA</th>
              <th className="label-xs p-4 text-muted-foreground">CREADO POR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            {visibleTransactions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyTransactions />
                </td>
              </tr>
            ) : null}
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="p-4 text-xs text-foreground/60">{dateTimeFormatter.format(new Date(transaction.created_at))}</td>
                <td className="p-4">
                  <p className="font-semibold">{fullName(transaction.club_members)}</p>
                  <p className="mt-1 font-mono text-xs text-foreground/35">{transaction.club_members?.member_code ?? '—'}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex border px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest ${transactionTypeClasses[transaction.transaction_type]}`}>
                    {transactionTypeLabels[transaction.transaction_type]}
                  </span>
                </td>
                <td className={`p-4 font-mono text-xs font-semibold ${transaction.points > 0 ? 'text-emerald-300' : 'text-accent'}`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                </td>
                <td className="p-4 font-mono text-xs">{transaction.balance_after}</td>
                <td className="max-w-sm p-4 text-xs text-foreground/60">{formatReference(transaction)}</td>
                <td className="p-4 text-xs text-foreground/60">{transaction.created_by_profile?.full_name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyTransactions() {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-sm font-semibold">Sin transacciones</p>
      <p className="mt-2 text-xs text-muted-foreground">Cuando se registren compras, ajustes o canjes aparecerán aquí.</p>
    </div>
  )
}
