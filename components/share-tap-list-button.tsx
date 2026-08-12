'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

type Props = {
  branchName: string
}

export function ShareTapListButton({ branchName }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = new URL(window.location.href)
    url.hash = 'tap-list'

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Tap list · Craft ${branchName}`,
          text: `Consulta el tap list de Craft ${branchName}.`,
          url: url.toString(),
        })
        return
      }

      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('[share-tap-list] Could not share tap list:', error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="label-xs inline-flex min-h-11 shrink-0 items-center gap-2 border border-foreground/25 px-3 py-2 font-semibold transition-colors hover:border-accent hover:text-accent active:bg-foreground/5 md:px-4"
      aria-live="polite"
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {copied ? 'Enlace copiado' : 'Compartir'}
    </button>
  )
}
