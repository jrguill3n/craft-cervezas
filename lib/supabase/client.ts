import { createBrowserClient } from '@supabase/ssr'

export type SupabaseBrowserConfig = {
  url: string
  anonKey: string
}

export function createClient(config?: SupabaseBrowserConfig) {
  const url = config?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = config?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Falta la configuración pública de Supabase. Reinicia el servidor después de configurar .env.local.',
    )
  }

  return createBrowserClient(
    url,
    anonKey,
    {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
    },
  )
}
