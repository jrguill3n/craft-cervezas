import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-sans text-2xl font-bold tracking-[0.25em] text-foreground">
            CRAFT
          </span>
          <p className="mt-1 label-xs text-muted-foreground">PANEL DE ADMINISTRACIÓN</p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
