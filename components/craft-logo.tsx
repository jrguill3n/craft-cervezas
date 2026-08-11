import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logotipo oficial de Craft.
 *
 * Wordmark horizontal (1464 x 196 px, proporción 7.47:1) recortado al límite
 * del trazo, con fondo transparente. Se usa sin deformar, recolorear ni añadir
 * efectos: la variante "blanco" va sobre negro y la "negro" sobre crema.
 */
const LOGO_RATIO = 1464 / 196

export function CraftWordmark({
  className,
  variant = 'blanco',
  width = 200,
  priority = false,
}: {
  className?: string
  variant?: 'blanco' | 'negro'
  width?: number
  priority?: boolean
}) {
  return (
    <Image
      src={`/brand/craft-logo-${variant}.png`}
      alt="Craft"
      width={width}
      height={Math.round(width / LOGO_RATIO)}
      className={cn('block h-auto', className)}
      priority={priority}
    />
  )
}
