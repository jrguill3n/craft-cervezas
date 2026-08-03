import Image from 'next/image'
import Link from 'next/link'
import { branches, contact } from '@/lib/craft-content'

export function SiteFooter() {
  return (
    <footer id="contacto" className="bg-foreground text-background">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Image
              src="/brand/craft-logo-blanco.svg"
              alt="Craft Cervezas"
              width={129}
              height={80}
              style={{ height: 80, width: 'auto' }}
            />
            <p className="mt-8 max-w-xs text-sm leading-relaxed text-background/70">
              Cerveza independiente, buena comida y mejores encuentros. Tres barras en
              Guadalajara.
            </p>
          </div>

          <div className="md:col-span-3">
            <h2 className="label-xs text-background/50">Sucursales</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {branches.map((branch) => (
                <li key={branch.slug}>
                  <Link
                    href={`/${branch.slug}`}
                    className="text-lg transition-colors hover:text-accent"
                  >
                    {branch.name}
                  </Link>
                  <p className="text-sm text-background/60">{branch.neighborhood}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="label-xs text-background/50">Redes</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {contact.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lg transition-colors hover:text-accent"
                  >
                    {social.label}
                  </a>
                  <p className="text-sm text-background/60">{social.handle}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="label-xs text-background/50">Contacto</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-accent">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.press}`} className="hover:text-accent">
                  {contact.press}
                </a>
              </li>
              <li className="text-background/60">{contact.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-background/25 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="label-xs text-background/50">
            © {new Date().getFullYear()} Craft Cervezas
          </p>
          <p className="label-xs text-background/50">
            Bebe con responsabilidad · Venta exclusiva a mayores de 18 años
          </p>
        </div>
      </div>
    </footer>
  )
}
