import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CraftIcon } from '@/components/craft-logo'
import { clubBenefits } from '@/lib/craft-content'

export function ClubCraft() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto grid max-w-[1600px] items-start gap-12 px-5 py-16 md:grid-cols-12 md:gap-x-8 md:gap-y-10 md:px-10 md:py-24">
        <div className="md:col-span-4 md:row-span-2">
          <p className="label-xs text-background/50">Programa de recompensas</p>
          <h2 className="display-tight mt-6 text-[clamp(3rem,7vw,5.5rem)]">
            Club
            <br />
            Craft
          </h2>
          <p className="mt-8 max-w-xs text-base leading-relaxed text-background/70">
            Una sola membresía para las tres sucursales. Tomas, acumulas y regresas.
          </p>
          <Link
            href="/club-craft"
            className="label-xs group mt-10 inline-flex items-center gap-3 bg-accent px-6 py-4 font-semibold text-accent-foreground"
          >
            Conoce Club Craft
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <ul className="md:col-span-7 md:col-start-6">
          {clubBenefits.map((benefit, i) => (
            <li
              key={benefit.index}
              className={`grid gap-x-6 gap-y-2 border-t border-background/25 py-8 md:grid-cols-12 ${
                i === clubBenefits.length - 1 ? 'border-b' : ''
              }`}
            >
              <span className="label-xs text-accent md:col-span-1">{benefit.index}</span>
              <h3 className="display-tight text-3xl md:col-span-5 md:text-4xl">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-background/70 md:col-span-6">
                {benefit.detail}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-6 md:col-span-7 md:col-start-6">
          <p className="label-xs text-background/50">Apple Wallet · Google Wallet</p>
          <CraftIcon variant="blanco" width={56} className="opacity-70" />
        </div>
      </div>
    </section>
  )
}
