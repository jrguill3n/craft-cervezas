import { cn } from '@/lib/utils'

/**
 * MARCADOR PROVISIONAL — no es el logotipo de Craft Cervezas.
 *
 * El logotipo oficial de Craft Cervezas aún no está disponible en el proyecto.
 * Deliberadamente se muestra sólo el nombre como texto plano, sin recrear ni
 * aproximar ningún lockup, y sin usar el logotipo de la marca hermana.
 *
 * Al recibir el archivo definitivo, sustituir el contenido de este componente
 * por la imagen: respetar el tamaño mínimo digital de 160 x 100 px del manual,
 * sin deformar, recolorear ni añadir efectos.
 */
export function CraftWordmark({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'md' | 'lg'
}) {
  return (
    <span
      className={cn(
        'block w-fit font-sans font-medium tracking-tight text-foreground',
        size === 'md' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl',
        className,
      )}
    >
      Craft Cervezas
    </span>
  )
}
