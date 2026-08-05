'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import { branches } from '@/lib/craft-content'
import { cn } from '@/lib/utils'

export function BranchFinder({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-xs', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="selector-sucursal"
        className="label-xs flex w-full items-center justify-between gap-3 bg-accent px-6 py-4 font-semibold text-accent-foreground"
      >
        Encuentra tu Craft
        {open ? (
          <X className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Plus className="size-4 shrink-0" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <ul
          id="selector-sucursal"
          className="absolute top-full left-0 z-20 w-full border-x border-b border-accent bg-background"
        >
          {branches.map((branch) => (
            <li key={branch.slug} className="border-t border-foreground/15 first:border-t-0">
              <Link
                href={`/${branch.slug}`}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-foreground hover:text-background"
              >
                <span>
                  <span className="display-tight block text-xl">{branch.name}</span>
                  <span className="label-xs text-muted-foreground group-hover:text-background/60">
                    {branch.neighborhood}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
