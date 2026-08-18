'use client'

import { useState } from 'react'

type Props = {
  url: string
  className?: string
}

export function InstagramLinkFallback({ url, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      ¿No abre? Copia el enlace y ábrelo en tu navegador.{' '}
      <button
        type="button"
        onClick={copyLink}
        className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-accent"
      >
        {copied ? 'Copiado' : 'Copiar enlace'}
      </button>
    </p>
  )
}
