'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProfileRow } from '@/lib/db-types'

type Props = { profile: Pick<ProfileRow, 'id' | 'full_name' | 'role'> }

const navItems = [
  { label: 'TAP LIST', href: '/admin' },
  { label: 'CERVEZAS', href: '/admin/beers' },
]

export function AdminSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-foreground/10 bg-background px-6 py-8">
      {/* Logo */}
      <div className="mb-10">
        <span className="font-sans text-base font-bold tracking-[0.25em] text-foreground">
          CRAFT
        </span>
        <p className="mt-0.5 text-[0.6rem] tracking-widest text-muted-foreground">
          ADMIN
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2.5 text-[0.7rem] font-semibold tracking-widest transition-colors ${
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
      <div className="mt-auto flex flex-col gap-3 border-t border-foreground/10 pt-6">
        <p className="truncate text-xs text-muted-foreground">
          {profile.full_name ?? '—'}
        </p>
        <p className="text-[0.6rem] tracking-widest text-foreground/30">
          {profile.role === 'super_admin' ? 'SUPER ADMIN' : 'MANAGER'}
        </p>
        <button
          onClick={handleLogout}
          className="mt-1 text-left text-[0.65rem] tracking-widest text-foreground/40 transition-colors hover:text-accent"
        >
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
  )
}
