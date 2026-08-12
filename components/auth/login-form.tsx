'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { login, type LoginState } from '@/app/auth/login/actions'

const initialState: LoginState = { error: null }

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label-xs text-foreground/70">
          CORREO
        </label>
        <input
          id="email"
          type="email"
          name="email"
          inputMode="email"
          required
          autoComplete="email"
          className="min-h-11 border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
          placeholder="hola@craftcervezas.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label-xs text-foreground/70">
          CONTRASEÑA
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="min-h-11 border border-foreground/20 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 min-h-11 border border-foreground bg-foreground py-3 text-sm font-semibold tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-50"
    >
      {pending ? 'ACCEDIENDO…' : 'INICIAR SESIÓN'}
    </button>
  )
}
