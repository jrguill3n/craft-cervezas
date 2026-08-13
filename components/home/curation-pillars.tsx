const pillars = [
  {
    markerClassName: 'bg-malta',
    title: 'Curaduría',
    detail: 'Selección nacional e internacional de las mejores cervecerías del mundo.',
  },
  {
    markerClassName: 'bg-lupulo',
    title: 'Cultura cervecera',
    detail: 'Nos encanta compartir nuestra pasión por la cerveza, acércate a la barra.',
  },
  {
    markerClassName: 'bg-hazy',
    title: 'Comunidad',
    detail: 'La cerveza nos une. Siempre hay algo por descubrir, brindemos juntos.',
  },
]

export function CurationPillars() {
  return (
    <section aria-labelledby="curaduria-craft" className="border-b border-foreground/20">
      <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <h2 id="curaduria-craft" className="sr-only">
          Curaduría Craft
        </h2>

        <ul className="grid gap-px border-t border-foreground/20 md:grid-cols-3">
          {pillars.map((pillar) => (
            <li
              key={pillar.title}
              className="border-b border-foreground/20 py-8 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <span
                className={`block h-1 w-10 ${pillar.markerClassName}`}
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

