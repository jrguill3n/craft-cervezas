import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logotipo oficial blanco. Se usa tal cual sobre fondo negro,
 * sin recolorear, deformar ni alterar sus proporciones.
 */
const LOGO_RATIO = 570.7 / 355.37
const ICON_RATIO = 360.51 / 238.49

export function CraftLogo({
  className,
  height = 40,
}: {
  className?: string
  height?: number
}) {
  return (
    <Image
      src="/brand/craft-logo-blanco.svg"
      alt="Craft Cervezas"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      style={{ height, width: 'auto' }}
      className={cn('block', className)}
      priority
    />
  )
}

export function CraftIcon({
  className,
  variant = 'negro',
  width = 44,
}: {
  className?: string
  variant?: 'negro' | 'blanco'
  width?: number
}) {
  return (
    <Image
      src={`/brand/craft-icono-${variant}.svg`}
      alt=""
      aria-hidden="true"
      width={width}
      height={Math.round(width / ICON_RATIO)}
      className={className}
    />
  )
}
