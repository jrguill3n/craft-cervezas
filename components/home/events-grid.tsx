import Link from 'next/link'
import { events } from '@/lib/craft-content'

export function EventsGrid() {
  return (
    <section className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid items-baseline gap-4 md:grid-cols-12">
          <h2 className="label-xs text-muted-foreground md:col-span-3">
            Eventos y promociones
          </h2>
          <p className="max-w-xl text-lg leading-relaxed md:col-span-6 md:col-start-4 md:text-xl">
            Espacio modular para lo que está pasando ahora en las barras.
          </p>
          <p className="label-xs text-muted-foreground md:col-span-2 md:col-start-11 md:text-right">
            Septiembre
          </p>
        </div>

        <ul className="mt-12 grid gap-px border-t border-foreground/20 md:grid-cols-3">
          {events.map((event) => (
            <li
              key={event.title}
              className="flex flex-col justify-between gap-8 border-b border-foreground/20 py-8 md:border-r md:border-b-0 md:px-6 md:last:border-r-0 md:first:pl-0"
            >
              <div>
                <div className="label-xs flex items-center justify-between">
                  <span className="text-malta">{event.date}</span>
                  <span className="text-muted-foreground">{event.branch}</span>
                </div>
                <h3 className="display-tight mt-6 text-3xl">{event.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                  {event.detail}
                </p>
              </div>
              <Link
                href={`/${event.branch.toLowerCase()}`}
                className="label-xs font-semibold underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
              >
                Ver sucursal
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
