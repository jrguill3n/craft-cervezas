import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { branches } from '@/lib/craft-content'

export function BranchSelector() {
  return (
    <section id="sucursales" className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-4 md:grid-cols-12">
          <h2 className="label-xs text-muted-foreground md:col-span-3">Elige tu Craft</h2>
          <p className="max-w-xl text-lg leading-relaxed md:col-span-7 md:col-start-4 md:text-xl">
            Tres barras, tres carácteres. Cada sucursal tiene su propia tap list, su cocina y
            su calendario.
          </p>
        </div>
      </div>

      <ul>
        {branches.map((branch) => (
          <li key={branch.slug} className="border-t border-foreground/20">
            <Link
              href={`/${branch.slug}`}
              className="group block transition-colors hover:bg-foreground hover:text-background"
            >
              <div className="mx-auto grid max-w-[1600px] items-center gap-x-6 gap-y-4 px-5 py-8 md:grid-cols-12 md:px-10 md:py-10">
                <span className="label-xs text-accent md:col-span-1">{branch.index}</span>

                <h3 className="display-tight text-[clamp(2.75rem,5vw,4.5rem)] md:col-span-3">
                  {branch.name}
                </h3>

                <div className="md:col-span-3">
                  <p className="label-xs text-muted-foreground group-hover:text-background/60">
                    {branch.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80 group-hover:text-background/80">
                    {branch.description}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="label-xs text-muted-foreground group-hover:text-background/60">
                    Hoy
                  </p>
                  <p className="mt-3 text-sm">{branch.hours[1].time}</p>
                  <p className="text-sm text-foreground/70 group-hover:text-background/70">
                    {branch.neighborhood}
                  </p>
                </div>

                <div className="relative hidden aspect-3/2 md:col-span-2 md:block">
                  <Image
                    src={branch.image}
                    alt={`Sucursal ${branch.name}`}
                    fill
                    sizes="(min-width: 768px) 17vw, 0px"
                    className="object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                  />
                </div>

                <span className="label-xs flex items-center gap-2 font-semibold text-accent md:col-span-1 md:justify-end">
                  Ver
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
