import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { branches, clubBenefits } from '@/lib/craft-content'

export const metadata: Metadata = {
  title: 'Club Craft',
  description:
    'El programa de recompensas de Craft Cervezas: 6 pintas más una gratis, puntos por consumo y tarjeta digital para Apple Wallet y Google Wallet.',
}

const steps = [
  { index: '01', title: 'Regístrate en la barra', detail: 'Pides tu membresía con cualquier bartender. Toma menos de un minuto.' },
  { index: '02', title: 'Registra tu consumo', detail: 'Cada pinta y cada consumo suman a tu cuenta en las tres sucursales.' },
  { index: '03', title: 'Canjea', detail: 'La séptima pinta va por nuestra cuenta y tus puntos se cambian por cerveza, comida o merch.' },
]

export default function ClubCraftPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 pt-10 pb-14 md:px-10 md:pt-14 md:pb-20">
            <div className="label-xs flex items-center gap-4 text-muted-foreground">
              <span className="text-accent">Programa de recompensas</span>
              <span className="h-px flex-1 bg-foreground/25" aria-hidden="true" />
              <span>Providencia · Americana · Chapalita</span>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-12">
              <h1 className="display-tight text-[clamp(3.5rem,10vw,8rem)] md:col-span-7">
                Club
                <br />
                Craft
              </h1>
              <div className="md:col-span-4 md:col-start-9">
                <p className="text-lg leading-relaxed text-foreground/80">
                  Una sola membresía para las tres barras. Sin plásticos, sin apps extra: tu
                  tarjeta vive en Apple Wallet y Google Wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-foreground/20">
          <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
            <h2 className="display-tight text-4xl md:text-6xl">Beneficios</h2>
            <ul className="mt-10 border-t border-foreground/20">
              {clubBenefits.map((benefit) => (
                <li
                  key={benefit.index}
                  className="grid gap-x-6 gap-y-3 border-b border-foreground/15 py-8 md:grid-cols-12"
                >
                  <span className="label-xs text-accent md:col-span-1">{benefit.index}</span>
                  <h3 className="display-tight text-3xl md:col-span-5 md:text-4xl">
                    {benefit.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/75 md:col-span-6">
                    {benefit.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
            <h2 className="display-tight text-4xl md:text-6xl">Cómo funciona</h2>
            <ol className="mt-10 grid gap-8 border-t border-background/25 pt-8 md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.index}>
                  <span className="label-xs text-background/45">{step.index}</span>
                  <h3 className="display-tight mt-4 text-2xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-background/70">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>
            <p className="label-xs mt-12 text-background/50">
              El registro digital estará disponible próximamente. Por ahora, pide tu membresía
              en cualquier barra.
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1600px] px-5 pt-14 md:px-10 md:pt-20">
            <h2 className="label-xs text-muted-foreground">Actívalo en tu barra</h2>
          </div>
          <ul className="mt-8">
            {branches.map((branch) => (
              <li key={branch.slug} className="border-t border-foreground/20">
                <Link
                  href={`/${branch.slug}`}
                  className="group block transition-colors hover:bg-foreground hover:text-background"
                >
                  <div className="mx-auto flex max-w-[1600px] items-baseline justify-between gap-6 px-5 py-8 md:px-10">
                    <div className="flex items-baseline gap-6">
                      <span className="label-xs text-accent group-hover:text-background/45">
                        {branch.index}
                      </span>
                      <h3 className="display-tight text-[clamp(2.25rem,5vw,4rem)]">
                        {branch.name}
                      </h3>
                    </div>
                    <ArrowUpRight
                      className="size-6 shrink-0 text-accent transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
