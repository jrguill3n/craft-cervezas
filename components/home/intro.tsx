import { intro } from '@/lib/craft-content'

const markerColor: Record<string, string> = {
  malta: 'bg-malta',
  lupulo: 'bg-lupulo',
  hazy: 'bg-hazy',
}

export function Intro() {
  return (
    <section className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <p className="label-xs text-accent md:col-span-3">{intro.eyebrow}</p>

          <div className="md:col-span-8 md:col-start-5">
            <h2 className="display-tight text-[clamp(2rem,4.4vw,3.75rem)] text-balance">
              {intro.statement}
            </h2>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
              {intro.body}
            </p>
          </div>
        </div>

        <ul className="mt-16 grid gap-px border-t border-foreground/20 md:mt-24 md:grid-cols-3">
          {intro.pillars.map((pillar) => (
            <li
              key={pillar.title}
              className="border-b border-foreground/20 py-8 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <span
                className={`block h-1 w-10 ${markerColor[pillar.marker]}`}
                aria-hidden="true"
              />
              <h3 className="display-tight mt-6 text-2xl md:text-3xl">{pillar.title}</h3>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/70">
                {pillar.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
