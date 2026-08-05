'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { CraftLogo } from '@/components/craft-logo'
import { branchNav, navigation, secondaryNav } from '@/lib/craft-content'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="border-b border-foreground/20 bg-background">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 md:px-10">
        <Link
          href="/"
          aria-label="Craft Cervezas, ir al inicio"
          className="shrink-0 transition-opacity hover:opacity-80"
          onClick={() => setOpen(false)}
        >
          <CraftLogo height={44} />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navigation.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'label-xs border-b border-transparent pb-1 font-medium transition-colors hover:text-accent',
                      active && 'border-accent text-accent',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-movil"
          className="label-xs flex items-center gap-2 border border-foreground/30 px-3 py-2 font-medium md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      {open ? (
        <nav
          id="menu-movil"
          aria-label="Principal móvil"
          className="border-t border-foreground/20 md:hidden"
        >
          <p className="label-xs px-5 pt-5 pb-1 text-muted-foreground">Sucursales</p>
          <ul>
            {branchNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="display-tight block px-5 py-3 text-3xl"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-4 border-t border-foreground/15">
            {secondaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="label-xs block px-5 py-4 font-semibold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
