import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CraftIcon } from '@/components/craft-logo'
import { branches } from '@/lib/craft-content'

export function Hero() {
  return (
    <section className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] md:grid md:grid-cols-12">
        <div className="flex flex-col justify-between px-5 pt-10 pb-8 md:col-span-7 md:px-10 md:pt-16 md:pb-10">
          <div className="label-xs flex items-center gap-4 text-muted-foreground">
            <span>Guadalajara · MX</span>
            <span className="h-px flex-1 bg-foreground/25" aria-hidden="true" />
            <span>Est. 2016</span>
          </div>

          <div className="mt-12 md:mt-20">
            <h1 className="display-tight text-[clamp(3.5rem,11vw,8.5rem)]">
              Nos mueve
              <br />
              la
              <br />
              cerveza
            </h1>

            <p className="mt-8 max-w-sm text-base leading-relaxed text-foreground/80 md:text-lg">
              Cerveza independiente, buena comida y mejores encuentros.
            </p>

            <Link
              href="#sucursales"
              className="label-xs group mt-10 inline-flex items-center gap-3 border-b-2 border-accent pb-2 font-semibold text-accent"
            >
              Elige tu Craft
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="mt-14 flex items-end justify-between gap-6 border-t border-foreground/20 pt-5 md:mt-20">
            <ul className="label-xs flex flex-wrap gap-x-8 gap-y-2 text-muted-foreground">
              {branches.map((branch) => (
                <li key={branch.slug}>
                  <Link href={`/${branch.slug}`} className="hover:text-accent">
                    {branch.name}
                  </Link>
                </li>
              ))}
            </ul>
            <CraftIcon width={52} className="hidden opacity-60 sm:block" />
          </div>
        </div>

        <div className="relative aspect-4/3 md:col-span-5 md:aspect-auto md:min-h-[42rem]">
          <Image
            src="/brand/craft-bar.jpg"
            alt="Interior de Craft Cervezas con clientes en la barra y las mesas comunales"
            fill
            priority
            sizes="(min-width: 768px) 42vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
