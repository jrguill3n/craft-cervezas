'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="font-sans text-2xl font-bold tracking-[0.25em] text-foreground">
            CRAFT
          </span>
          <p className="mt-1 label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="label-xs text-foreground/70">
              CORREO
            </label>
            <input
              id="email"
              type="text"
              inputMode="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              placeholder="craftchapalita@craft.mx"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="label-xs text-foreground/70">
              CONTRASEÑA
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-accent" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-foreground bg-foreground py-3 text-sm font-semibold tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-50"
          >
            {loading ? 'ACCEDIENDO…' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </main>
  )
}
