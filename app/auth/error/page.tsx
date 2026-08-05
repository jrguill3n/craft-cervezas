export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <p className="label-xs text-accent">Error de autenticación</p>
      <h1 className="display-tight mt-3 text-4xl text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-4 max-w-sm text-center text-sm text-muted-foreground">
        El enlace de acceso expiró o no es válido. Vuelve a iniciar sesión.
      </p>
      <a
        href="/auth/login"
        className="mt-8 border border-foreground px-6 py-3 text-sm font-semibold tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        VOLVER AL LOGIN
      </a>
    </main>
  )
}
