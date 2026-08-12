'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { CraftWordmark } from '@/components/craft-logo'
import { branchNav } from '@/lib/craft-content'
import { cn } from '@/lib/utils'

const tapListNav = branchNav.map((branch) => ({
  label: branch.label,
  href: `${branch.href.replace(/^\//, '/taplist?ubicacion=')}`,
}))

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [tapListsOpen, setTapListsOpen] = useState(false)
  const [branchesOpen, setBranchesOpen] = useState(false)
  const [mobileTapListsOpen, setMobileTapListsOpen] = useState(false)
  const [mobileBranchesOpen, setMobileBranchesOpen] = useState(false)
  const pathname = usePathname()
  const isBranchPage = branchNav.some((item) => item.href === pathname)

  const desktopNavItemClassName = 'inline-flex min-h-12 items-center border-b border-transparent text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:text-accent'
  const mobileNavItemClassName = 'label-xs flex min-h-16 w-full items-center justify-between px-5 py-4 text-left text-base font-semibold tracking-[0.22em]'

  return (
    <header className="border-b border-foreground/20 bg-background">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-6 md:px-10 md:py-7">
        <Link
          href="/"
          aria-label="Craft, ir al inicio"
          className="shrink-0 transition-opacity hover:opacity-70"
          onClick={() => setOpen(false)}
        >
          <CraftWordmark width={176} priority />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-10">
            <li className="relative">
              <button
                type="button"
                onClick={() => {
                  setTapListsOpen((value) => !value)
                  setBranchesOpen(false)
                }}
                aria-expanded={tapListsOpen}
                aria-haspopup="menu"
                className={cn(
                  desktopNavItemClassName,
                  'gap-1',
                  pathname === '/taplist' && 'border-accent text-accent',
                )}
              >
                Tap Lists
                <ChevronDown
                  className={cn('size-3 transition-transform', tapListsOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {tapListsOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-4 min-w-52 border border-foreground/20 bg-background py-2 shadow-2xl shadow-background/40"
                >
                  {tapListNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setTapListsOpen(false)}
                      className="label-xs block px-4 py-3 font-semibold text-foreground/75 transition-colors hover:bg-foreground hover:text-background"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>

            <li className="relative">
              <button
                type="button"
                onClick={() => {
                  setBranchesOpen((value) => !value)
                  setTapListsOpen(false)
                }}
                aria-expanded={branchesOpen}
                aria-haspopup="menu"
                className={cn(
                  desktopNavItemClassName,
                  'gap-1',
                  isBranchPage && 'border-accent text-accent',
                )}
              >
                Sucursales
                <ChevronDown
                  className={cn('size-3 transition-transform', branchesOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {branchesOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-30 mt-4 min-w-52 border border-foreground/20 bg-background py-2 shadow-2xl shadow-background/40"
                >
                  {branchNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setBranchesOpen(false)}
                      className="label-xs block px-4 py-3 font-semibold text-foreground/75 transition-colors hover:bg-foreground hover:text-background"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-movil"
          className="label-xs flex min-h-11 items-center gap-2 justify-self-end border border-foreground/30 px-3 py-2 font-medium lg:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      {open ? (
        <nav
          id="menu-movil"
          aria-label="Principal móvil"
          className="border-t border-foreground/20 lg:hidden"
        >
          <ul>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMobileTapListsOpen((value) => !value)
                  setMobileBranchesOpen(false)
                }}
                aria-expanded={mobileTapListsOpen}
                className={cn(
                  mobileNavItemClassName,
                  pathname === '/taplist' && 'text-accent',
                )}
              >
                Tap Lists
                <ChevronDown
                  className={cn('size-5 transition-transform', mobileTapListsOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {mobileTapListsOpen ? (
                <ul className="border-y border-foreground/15 bg-foreground/[0.03] py-2">
                  {tapListNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpen(false)
                          setMobileTapListsOpen(false)
                        }}
                        className="label-xs block px-8 py-3 font-semibold text-foreground/75"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>

            <li>
              <button
                type="button"
                onClick={() => {
                  setMobileBranchesOpen((value) => !value)
                  setMobileTapListsOpen(false)
                }}
                aria-expanded={mobileBranchesOpen}
                className={cn(
                  mobileNavItemClassName,
                  isBranchPage && 'text-accent',
                )}
              >
                Sucursales
                <ChevronDown
                  className={cn('size-5 transition-transform', mobileBranchesOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {mobileBranchesOpen ? (
                <ul className="border-y border-foreground/15 bg-foreground/[0.03] py-2">
                  {branchNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpen(false)
                          setMobileBranchesOpen(false)
                        }}
                        className="label-xs block px-8 py-3 font-semibold text-foreground/75"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
