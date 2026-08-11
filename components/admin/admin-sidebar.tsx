'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  createClient,
  type SupabaseBrowserConfig,
} from '@/lib/supabase/client'
import type { ProfileRow } from '@/lib/db-types'

type Props = {
  profile: Pick<ProfileRow, 'id' | 'full_name' | 'role'>
  supabaseConfig: SupabaseBrowserConfig
}

const navItems = [
  { label: 'TAP LIST', href: '/admin' },
  { label: 'CERVEZAS', href: '/admin/beers' },
]

export function AdminSidebar({ profile, supabaseConfig }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  async function handleLogout() {
    const supabase = createClient(supabaseConfig)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-16 w-full items-center justify-between border-b border-foreground/10 bg-background px-4 xl:hidden">
        <div>
          <span className="font-sans text-base font-bold tracking-[0.25em] text-foreground">CRAFT</span>
          <p className="mt-0.5 text-[0.6rem] tracking-widest text-muted-foreground">ADMIN</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex size-11 items-center justify-center border border-foreground/20 text-foreground"
          aria-label="Abrir menú de administración"
          aria-expanded={isOpen}
          aria-controls="admin-navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menú de administración"
        />
      )}

      <aside
        id="admin-navigation"
        aria-label="Navegación de administración"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(19rem,86vw)] shrink-0 flex-col items-stretch border-r border-foreground/10 bg-background px-5 py-5 shadow-2xl transition-transform duration-200 xl:sticky xl:top-0 xl:z-30 xl:h-screen xl:w-56 xl:translate-x-0 xl:px-6 xl:py-8 xl:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between xl:hidden">
          <div>
            <span className="font-sans text-base font-bold tracking-[0.25em] text-foreground">CRAFT</span>
            <p className="mt-0.5 text-[0.6rem] tracking-widest text-muted-foreground">ADMIN</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex size-11 items-center justify-center border border-foreground/20"
            aria-label="Cerrar menú"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Logo */}
        <div className="mb-10 hidden xl:block">
          <span className="font-sans text-base font-bold tracking-[0.25em] text-foreground">
            CRAFT
          </span>
          <p className="mt-0.5 text-[0.6rem] tracking-widest text-muted-foreground">
            ADMIN
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex min-h-11 items-center px-3 py-2.5 text-[0.7rem] font-semibold tracking-widest transition-colors ${
                  active
                    ? 'bg-foreground text-background'
                  : 'text-foreground/50 hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col items-stretch gap-3 border-t border-foreground/10 pt-6">
          <p className="truncate text-xs text-muted-foreground">
            {profile.full_name ?? '—'}
          </p>
          <p className="text-[0.6rem] tracking-widest text-foreground/30">
            {profile.role === 'super_admin' ? 'SUPER ADMIN' : 'MANAGER'}
          </p>
          <button
            onClick={handleLogout}
            className="min-h-11 text-left text-[0.65rem] tracking-widest text-foreground/40 transition-colors hover:text-accent xl:mt-1"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </aside>
    </>
  )
}
