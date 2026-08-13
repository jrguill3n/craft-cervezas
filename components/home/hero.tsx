import Image from 'next/image'
import { BranchFinder } from '@/components/home/branch-finder'

export function Hero() {
  return (
    <section id="sucursales" className="scroll-mt-24 border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] md:grid md:grid-cols-12">
        <div className="flex flex-col px-5 pt-10 pb-12 md:col-span-7 md:px-10 md:pt-16 md:pb-16">
          <div className="label-xs flex items-center gap-4 text-muted-foreground">
            <span>Guadalajara · MX</span>
            <span className="h-px flex-1 bg-foreground/25" aria-hidden="true" />
            <span>Est. 2018</span>
          </div>

          <div className="mt-16 md:mt-auto md:pt-24">
            <h1 className="display-tight text-[clamp(3.5rem,11vw,8.5rem)]">
              Nos mueve
              <br />
              la
              <br />
              cerveza
            </h1>

            <p className="mt-8 max-w-sm text-base leading-relaxed text-foreground/80 md:text-lg">
              Cervezas hechas para compartir historias.
            </p>

            <BranchFinder className="mt-10" />
          </div>
        </div>

        <div className="relative aspect-4/3 md:col-span-5 md:aspect-auto md:min-h-[42rem]">
          <Image
            src="/images/locations/americana/hero.webp"
            alt="Fachada e interior nocturno de Craft Americana con clientes en la barra"
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
