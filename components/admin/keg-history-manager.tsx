'use client'

import { useMemo, useState } from 'react'
import type { KegConnectionFull, LocationRow } from '@/lib/db-types'

type Props = {
  connections: KegConnectionFull[]
  locations: LocationRow[]
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
})

export function KegHistoryManager({ connections, locations }: Props) {
  const [locationId, setLocationId] = useState('all')
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('all')

  const visibleConnections = useMemo(() => connections.filter((connection) => {
    if (locationId !== 'all' && connection.location_id !== locationId) return false
    if (status === 'open' && connection.disconnected_at !== null) return false
    if (status === 'closed' && connection.disconnected_at === null) return false
    return true
  }), [connections, locationId, status])

  return (
    <div className="w-full px-4 py-5 md:px-6 md:py-8 xl:px-8">
      <div className="mb-8">
        <p className="label-xs text-muted-foreground">OPERACIÓN</p>
        <h1 className="display-tight mt-2 text-4xl text-foreground md:text-5xl">Historial de barriles</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {visibleConnections.length} de {connections.length} movimiento{connections.length !== 1 ? 's' : ''}
        </p>
      </div>

      <section className="mb-6 grid gap-3 border-y border-foreground/10 py-4 md:grid-cols-2 md:border md:p-4">
        <label className="text-xs font-semibold tracking-widest text-foreground/50">
          SUCURSAL
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="mt-2 min-h-12 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground"
          >
            <option value="all">Todas</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold tracking-widest text-foreground/50">
          ESTADO
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="mt-2 min-h-12 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground"
          >
            <option value="all">Todos</option>
            <option value="open">Conectados</option>
            <option value="closed">Terminados</option>
          </select>
        </label>
      </section>

      <div className="overflow-x-auto border-y border-foreground/10">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="label-xs p-4 text-muted-foreground">SUCURSAL</th>
              <th className="label-xs p-4 text-muted-foreground">LLAVE</th>
              <th className="label-xs p-4 text-muted-foreground">CERVEZA</th>
              <th className="label-xs p-4 text-muted-foreground">CONEXIÓN</th>
              <th className="label-xs p-4 text-muted-foreground">TERMINÓ</th>
              <th className="label-xs p-4 text-muted-foreground">USUARIOS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/5">
            {visibleConnections.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Sin movimientos.</td></tr>
            ) : null}
            {visibleConnections.map((connection) => (
              <tr key={connection.id}>
                <td className="p-4 font-semibold">{connection.locations.name}</td>
                <td className="p-4 font-mono text-accent">{String(connection.tap_number).padStart(2, '0')}</td>
                <td className="p-4">
                  <p className="font-semibold">{connection.beers.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{connection.beers.brewery} · {connection.beers.style}</p>
                </td>
                <td className="p-4 text-xs text-foreground/65">{dateTimeFormatter.format(new Date(connection.connected_at))}</td>
                <td className="p-4 text-xs text-foreground/65">
                  {connection.disconnected_at ? dateTimeFormatter.format(new Date(connection.disconnected_at)) : (
                    <span className="border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">CONECTADO</span>
                  )}
                </td>
                <td className="p-4 text-xs text-foreground/60">
                  <p>Conectó: {connection.connected_by_profile?.full_name ?? '—'}</p>
                  <p className="mt-1">Terminó: {connection.disconnected_by_profile?.full_name ?? '—'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
