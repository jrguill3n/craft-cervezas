import Link from 'next/link'
import { CraftWordmark } from '@/components/craft-logo'
import { branches, contact } from '@/lib/craft-content'

const contactEmail = 'hola@craftcervezas.com'
const socialLinks = contact.socials
  .filter((social) => social.label !== 'WhatsApp')
  .map((social) => social.label === 'Facebook'
    ? { ...social, href: 'https://facebook.com/craftcervezas' }
    : social)

export function SiteFooter() {
  return (
    <footer id="contacto" className="border-t border-foreground/20 bg-background">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <CraftWordmark width={240} />
            <p className="mt-8 max-w-xs text-sm leading-relaxed text-foreground/70">
              Cerveza independiente, buena comida y mejores encuentros. Tres barras en
              Guadalajara.
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="label-xs text-muted-foreground">Sucursales</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {branches.map((branch) => (
                <li key={branch.slug}>
                  <Link
                    href={`/${branch.slug}`}
                    className="text-lg transition-colors hover:text-accent"
                  >
                    {branch.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{branch.neighborhood}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="label-xs text-muted-foreground">Redes</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lg transition-colors hover:text-accent"
                  >
                    {social.label}
                  </a>
                  <p className="text-sm text-muted-foreground">{social.handle}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="label-xs text-muted-foreground">Contacto</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-accent">
                  {contactEmail}
                </a>
              </li>
              <li className="text-muted-foreground">{contact.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-foreground/20 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="label-xs text-muted-foreground">
            © {new Date().getFullYear()} Craft Cervezas
          </p>
          <p className="label-xs text-muted-foreground">
            Bebe con responsabilidad · Venta exclusiva a mayores de 18 años
          </p>
        </div>
      </div>
    </footer>
  )
}
