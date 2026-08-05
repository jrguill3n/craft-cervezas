import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Iconografía cervecera del sistema visual compartido (espiga de malta,
 * tanque de fermentación y lúpulo). Se usa como recurso gráfico de apoyo,
 * nunca como logotipo ni como firma de marca.
 */
const RATIO = 360.3 / 238.6

export function BrewIllustration({
  variant = 'blanco',
  width = 320,
  className,
}: {
  variant?: 'blanco' | 'negro'
  width?: number
  className?: string
}) {
  return (
    <Image
      src={`/brand/ilustracion-cervecera-${variant}.svg`}
      alt=""
      aria-hidden="true"
      width={width}
      height={Math.round(width / RATIO)}
      style={{ width, height: 'auto' }}
      className={cn('block', className)}
    />
  )
}
