import { cn } from '@/lib/utils'

/**
 * Marca provisional de Craft Cervezas.
 *
 * Los archivos recibidos (logotipo blanco e isotipo de botella) corresponden a
 * Craft Galaxy, por lo que NO se usan aquí. Hasta recibir el logotipo oficial de
 * Craft Cervezas, la marca se compone tipográficamente con la fuente display.
 *
 * Al sustituirlo por el archivo definitivo: respetar el tamaño mínimo digital
 * de 160 x 100 px indicado en el manual y no deformar ni recolorear la pieza.
 */
export function CraftWordmark({
  className,
  size = 'md',
}: {
  className?: string
  /** `md` cumple el mínimo de 160 x 100 px del manual. `lg` para piezas amplias. */
  size?: 'md' | 'lg'
}) {
  return (
    <span
      className={cn(
        'display-tight block w-fit text-foreground',
        size === 'md' ? 'text-[2.6rem] md:text-[2.9rem]' : 'text-[3.5rem] md:text-[4.25rem]',
        className,
      )}
    >
      <span className="sr-only">Craft Cervezas</span>
      <span aria-hidden="true" className="block">
        Craft
      </span>
      <span aria-hidden="true" className="block">
        Cervezas
      </span>
    </span>
  )
}
